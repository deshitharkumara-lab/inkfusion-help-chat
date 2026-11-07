import { Hono, type Context } from "hono";
import type { Env } from "./env";
import { MACHINES } from "./env";
import { isOpen } from "./hours";
import { parseGuide, setStatusInYaml, machinesOf, type Guide } from "./guides";
import { AiUnavailable, chatReply, translate, type Lang, type ChatTurn } from "./ai";
import { login, logout, requireAdmin } from "./auth";
import { sendAlert } from "./whatsapp";

type C = Context<{ Bindings: Env }>;
const app = new Hono<{ Bindings: Env }>();

const LANGS: Lang[] = ["en", "si", "ta", "singlish"];
const asLang = (v: unknown): Lang => (LANGS.includes(v as Lang) ? (v as Lang) : "en");
const ip = (c: C) => c.req.header("cf-connecting-ip") ?? "local";
const uid = () => crypto.randomUUID();
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };
const ADMIN_FILE_TYPES: Record<string, { kind: string; ext: string }> = {
  "application/pdf": { kind: "pdf", ext: "pdf" },
  "image/jpeg": { kind: "image", ext: "jpg" },
  "image/png": { kind: "image", ext: "png" },
  "image/webp": { kind: "image", ext: "webp" },
  "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
};

async function hit(c: C, bucket: string, limit: number, windowSec = 3600) {
  const now = Date.now();
  const key = `${bucket}:${ip(c)}:${Math.floor(now / (windowSec * 1000))}`;
  const r = await c.env.DB.prepare(
    `INSERT INTO ratelimit (key, count, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`,
  )
    .bind(key, now + windowSec * 1000)
    .first<{ count: number }>();
  return (r?.count ?? 0) <= limit;
}

async function approvedGuides(env: Env, machine?: string | null): Promise<{ id: string; guide: Guide }[]> {
  const rows = await env.DB.prepare("SELECT id, yaml FROM guides WHERE status = 'approved' ORDER BY problem").all<{ id: string; yaml: string }>();
  const out: { id: string; guide: Guide }[] = [];
  for (const r of rows.results) {
    try {
      const guide = parseGuide(r.yaml);
      if (!machine || machinesOf(guide).includes(machine)) out.push({ id: r.id, guide });
    } catch (e) {
      console.error("Skipping invalid approved guide", r.id, (e as Error).message);
    }
  }
  return out;
}

/** Only links and uploaded public files can be shown to customers. */
function mediaUrl(m: string | null | undefined): string | null {
  if (!m) return null;
  if (/^https:\/\//.test(m) || m.startsWith("/media/public/")) return m;
  return null;
}

/* ===================== Public API ===================== */

app.get("/api/config", (c) =>
  c.json({ open: isOpen(c.env), callNumber: c.env.CALL_NUMBER, callDisplay: c.env.CALL_NUMBER_DISPLAY, machines: MACHINES, aiEnabled: !!c.env.ANTHROPIC_API_KEY }),
);

app.get("/api/problems", async (c) => {
  const machine = c.req.query("machine");
  const lang = asLang(c.req.query("lang"));
  const guides = await approvedGuides(c.env, machine);
  let titles = guides.map((g) => g.guide.problem);
  let translated = lang === "en";
  try {
    titles = await translate(c.env, ip(c), lang, titles);
    translated = true;
  } catch {
    /* fall back to English titles */
  }
  return c.json({ translated, problems: guides.map((g, i) => ({ id: g.id, problem: titles[i] })) });
});

app.get("/api/guide/:id", async (c) => {
  const lang = asLang(c.req.query("lang"));
  const row = await c.env.DB.prepare("SELECT yaml FROM guides WHERE id = ? AND status = 'approved'").bind(c.req.param("id")).first<{ yaml: string }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  const g = parseGuide(row.yaml);
  const askFirst = g.ask_first ?? [];
  const texts = [g.problem, g.safety ?? "", g.prevention_tip ?? "", ...askFirst, ...g.steps.map((s) => s.text), ...g.escalate_if];
  let t = texts;
  let translated = lang === "en";
  try {
    t = await translate(c.env, ip(c), lang, texts);
    translated = true;
  } catch {
    /* English fallback */
  }
  let i = 3;
  const ask = t.slice(i, (i += askFirst.length));
  const steps = g.steps.map((s) => ({ text: t[i++], media: mediaUrl(s.media) }));
  return c.json({
    id: g.id,
    translated,
    problem: t[0],
    safety: t[1] || null,
    prevention_tip: t[2] || null,
    ask_first: ask,
    steps,
    escalate_if: t.slice(i),
  });
});

app.post("/api/chat/start", async (c) => {
  if (!(await hit(c, "chatstart", 30))) return c.json({ error: "Too many chats. Please try again later." }, 429);
  const b = await c.req.json().catch(() => ({}));
  const id = uid();
  await c.env.DB.prepare("INSERT INTO chats (id, machine, lang) VALUES (?, ?, ?)")
    .bind(id, MACHINES.includes(b.machine) ? b.machine : null, asLang(b.lang))
    .run();
  return c.json({ id });
});

app.post("/api/chat/:id/save", async (c) => {
  const b = await c.req.json().catch(() => null);
  if (!b) return c.json({ error: "bad_request" }, 400);
  const transcript = JSON.stringify(Array.isArray(b.transcript) ? b.transcript : []);
  if (transcript.length > 200_000) return c.json({ error: "too_large" }, 413);
  const outcome = ["fixed", "escalated"].includes(b.outcome) ? b.outcome : null;
  await c.env.DB.prepare(
    `UPDATE chats SET machine = ?, model = ?, warranty = ?, lang = ?, guide_id = ?, outcome = COALESCE(?, outcome),
     transcript = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(MACHINES.includes(b.machine) ? b.machine : null, clip(b.model, 100) || null, clip(b.warranty, 20) || null, asLang(b.lang), clip(b.guide_id, 100) || null, outcome, transcript, c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

app.post("/api/chat/:id/message", async (c) => {
  const b = await c.req.json().catch(() => null);
  if (!b || !clip(b.text, 2000)) return c.json({ error: "bad_request" }, 400);
  const machine = MACHINES.includes(b.machine) ? b.machine : null;
  const history: ChatTurn[] = (Array.isArray(b.history) ? b.history : [])
    .filter((t: ChatTurn) => (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .map((t: ChatTurn) => ({ role: t.role, text: t.text.slice(0, 2000) }));
  history.push({ role: "user", text: clip(b.text, 2000) });
  try {
    const guides = await approvedGuides(c.env, machine);
    const ans = await chatReply(c.env, ip(c), {
      machine,
      guides,
      currentGuideId: clip(b.guide_id, 100) || null,
      currentStep: Number.isInteger(b.step) ? b.step : null,
      history,
    });
    return c.json(ans);
  } catch (e) {
    if (e instanceof AiUnavailable) return c.json({ unavailable: e.reason });
    throw e;
  }
});

app.post("/api/upload", async (c) => {
  if (!(await hit(c, "upload", 20))) return c.json({ error: "Too many uploads. Please try again later." }, 429);
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return c.json({ error: "No file." }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return c.json({ error: "Please send a photo (JPG, PNG, WEBP or HEIC)." }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: "Photo is too big (max 8 MB)." }, 400);
  const key = `private/customer/${new Date().toISOString().slice(0, 10)}/${uid()}.${ext}`;
  await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return c.json({ key });
});

app.post("/api/tech-request", async (c) => {
  if (!(await hit(c, "techreq", 5))) return c.json({ error: "Too many requests. Please call us or try again later." }, 429);
  const b = await c.req.json().catch(() => null);
  if (!b) return c.json({ error: "bad_request" }, 400);
  const name = clip(b.name, 100), phone = clip(b.phone, 30), town = clip(b.town, 100);
  if (!name || !town || !/^[+0-9 ()-]{9,20}$/.test(phone)) return c.json({ error: "Please enter your name, a valid phone number and your town." }, 400);
  if (b.chargeable_ack !== true) return c.json({ error: "Please confirm you understand technician visits are chargeable." }, 400);
  const photoKey = typeof b.photo_key === "string" && b.photo_key.startsWith("private/customer/") ? b.photo_key : null;
  const id = uid();
  const rec = {
    machine: MACHINES.includes(b.machine) ? b.machine : clip(b.machine, 30),
    model: clip(b.model, 100),
    warranty: clip(b.warranty, 20),
    summary: clip(b.summary, 1000),
    steps: clip(b.steps_tried, 4000),
  };
  await c.env.DB.prepare(
    `INSERT INTO tech_requests (id, chat_id, name, phone, town, machine, model, warranty, summary, steps_tried, photo_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, clip(b.chat_id, 64) || null, name, phone, town, rec.machine, rec.model, rec.warranty, rec.summary, rec.steps, photoKey)
    .run();
  if (b.chat_id) await c.env.DB.prepare("UPDATE chats SET outcome = 'escalated' WHERE id = ?").bind(clip(b.chat_id, 64)).run();

  const origin = new URL(c.req.url).origin;
  c.executionCtx.waitUntil(
    (async () => {
      let status = "failed", err: string | null = null;
      try {
        status = await sendAlert(c.env, {
          name, phone, town, machine: rec.machine, model: rec.model, warranty: rec.warranty, summary: rec.summary,
          photoUrl: photoKey ? `${origin}/media/${photoKey}` : null,
          adminUrl: `${origin}/admin.html#request=${id}`,
        });
      } catch (e) {
        err = (e as Error).message;
        console.error("WhatsApp alert failed", err);
      }
      await c.env.DB.prepare("UPDATE tech_requests SET alert_status = ?, alert_error = ? WHERE id = ?").bind(status, err, id).run();
    })(),
  );
  return c.json({ ok: true, id });
});

/* ===================== Media ===================== */

async function serveFile(c: C, key: string) {
  const obj = await c.env.FILES.get(key);
  if (!obj) return c.notFound();
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("etag", obj.httpEtag);
  h.set("cache-control", key.startsWith("public/") ? "public, max-age=86400" : "private, no-store");
  return new Response(obj.body, { headers: h });
}
app.get("/media/public/*", (c) => serveFile(c, c.req.path.slice("/media/".length)));
app.get("/media/private/*", requireAdmin, (c) => serveFile(c, c.req.path.slice("/media/".length)));

/* ===================== Admin API ===================== */

app.post("/api/admin/login", async (c) => {
  if (!(await hit(c, "login", 10))) return c.json({ error: "Too many tries. Wait an hour." }, 429);
  const b = await c.req.json().catch(() => ({}));
  if (!c.env.ADMIN_PASSWORD) return c.json({ error: "ADMIN_PASSWORD is not set in Cloudflare yet." }, 401);
  return (await login(c, String(b.password ?? ""))) ? c.json({ ok: true }) : c.json({ error: "Wrong password." }, 401);
});
app.post("/api/admin/logout", (c) => {
  logout(c);
  return c.json({ ok: true });
});

const admin = new Hono<{ Bindings: Env }>();
admin.use("*", requireAdmin);

admin.get("/me", (c) => c.json({ ok: true, aiEnabled: !!c.env.ANTHROPIC_API_KEY, whatsappEnabled: !!(c.env.WHATSAPP_TOKEN && c.env.WHATSAPP_PHONE_NUMBER_ID) }));

// --- technician requests ---
admin.get("/requests", async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM tech_requests ORDER BY created_at DESC LIMIT 300").all();
  return c.json(rows.results);
});
admin.get("/requests/:id", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM tech_requests WHERE id = ?").bind(c.req.param("id")).first<Record<string, unknown>>();
  if (!r) return c.notFound();
  const chat = r.chat_id ? await c.env.DB.prepare("SELECT * FROM chats WHERE id = ?").bind(r.chat_id).first() : null;
  return c.json({ request: r, chat });
});
admin.patch("/requests/:id", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!["new", "contacted", "done"].includes(b.status)) return c.json({ error: "bad status" }, 400);
  await c.env.DB.prepare("UPDATE tech_requests SET status = ? WHERE id = ?").bind(b.status, c.req.param("id")).run();
  return c.json({ ok: true });
});

// --- chats ---
admin.get("/chats", async (c) => {
  const rows = await c.env.DB.prepare("SELECT id, created_at, machine, model, warranty, lang, guide_id, outcome FROM chats ORDER BY created_at DESC LIMIT 200").all();
  return c.json(rows.results);
});
admin.get("/chats/:id", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM chats WHERE id = ?").bind(c.req.param("id")).first();
  return r ? c.json(r) : c.notFound();
});

// --- guides ---
admin.get("/guides", async (c) => {
  const rows = await c.env.DB.prepare("SELECT id, machine, problem, status, updated_at FROM guides ORDER BY machine, problem").all();
  return c.json(rows.results);
});
admin.get("/guides/:id", async (c) => {
  const r = await c.env.DB.prepare("SELECT * FROM guides WHERE id = ?").bind(c.req.param("id")).first();
  return r ? c.json(r) : c.notFound();
});

async function saveGuide(env: Env, src: string, expectId?: string) {
  const g = parseGuide(src);
  if (expectId && g.id !== expectId) throw new Error(`The id in the file (${g.id}) must stay "${expectId}". To make a new guide, use "New guide".`);
  await env.DB.prepare(
    `INSERT INTO guides (id, machine, problem, yaml, status, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET machine = excluded.machine, problem = excluded.problem, yaml = excluded.yaml,
       status = excluded.status, updated_at = excluded.updated_at`,
  )
    .bind(g.id, JSON.stringify(machinesOf(g)), g.problem, src, g.status)
    .run();
  return g;
}

admin.put("/guides/:id", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  try {
    const g = await saveGuide(c.env, String(b.yaml ?? ""), c.req.param("id"));
    return c.json({ ok: true, id: g.id, status: g.status });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
admin.post("/guides", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  try {
    const src = String(b.yaml ?? "");
    const id = parseGuide(src).id;
    if (await c.env.DB.prepare("SELECT 1 FROM guides WHERE id = ?").bind(id).first()) return c.json({ error: `A guide with id "${id}" already exists.` }, 400);
    const g = await saveGuide(c.env, src);
    return c.json({ ok: true, id: g.id });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
admin.post("/guides/:id/status", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (b.status !== "draft" && b.status !== "approved") return c.json({ error: "bad status" }, 400);
  const r = await c.env.DB.prepare("SELECT yaml FROM guides WHERE id = ?").bind(c.req.param("id")).first<{ yaml: string }>();
  if (!r) return c.notFound();
  try {
    await saveGuide(c.env, setStatusInYaml(r.yaml, b.status), c.req.param("id"));
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
admin.delete("/guides/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM guides WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
admin.post("/guides/upload", async (c) => {
  const form = await c.req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => typeof f !== "string");
  const results: { file: string; ok: boolean; id?: string; error?: string }[] = [];
  for (const f of files.slice(0, 100)) {
    try {
      if (f.size > 100_000) throw new Error("File too big for a guide.");
      const g = await saveGuide(c.env, await f.text());
      results.push({ file: f.name, ok: true, id: g.id });
    } catch (e) {
      results.push({ file: f.name, ok: false, error: (e as Error).message });
    }
  }
  return c.json({ results });
});

// --- knowledge files (manuals, photos, videos, links) ---
admin.get("/files", async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM files ORDER BY created_at DESC").all();
  return c.json(rows.results);
});
admin.post("/files", async (c) => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return c.json({ error: "No file." }, 400);
  const t = ADMIN_FILE_TYPES[file.type];
  if (!t) return c.json({ error: "Allowed: PDF, JPG, PNG, WEBP, MP4, WEBM." }, 400);
  if (file.size > 95 * 1024 * 1024) return c.json({ error: "File too big (max 95 MB). Put big videos on YouTube (unlisted) and add the link." }, 400);
  const id = uid();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  // Manuals stay private (admin only). Photos and videos are public so customers can see them in a guide step.
  const key = `${t.kind === "pdf" ? "private/manuals" : "public/media"}/${id.slice(0, 8)}-${safeName}`;
  await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await c.env.DB.prepare("INSERT INTO files (id, kind, name, r2_key, size) VALUES (?, ?, ?, ?, ?)").bind(id, t.kind, file.name, key, file.size).run();
  return c.json({ ok: true, id, key, url: `/media/${key}` });
});
admin.post("/files/link", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const url = clip(b.url, 500), name = clip(b.name, 200);
  if (!/^https:\/\//.test(url) || !name) return c.json({ error: "Enter a name and a link starting with https://" }, 400);
  await c.env.DB.prepare("INSERT INTO files (id, kind, name, url) VALUES (?, 'link', ?, ?)").bind(uid(), name, url).run();
  return c.json({ ok: true });
});
admin.delete("/files/:id", async (c) => {
  const r = await c.env.DB.prepare("SELECT r2_key FROM files WHERE id = ?").bind(c.req.param("id")).first<{ r2_key: string | null }>();
  if (r?.r2_key) await c.env.FILES.delete(r.r2_key);
  await c.env.DB.prepare("DELETE FROM files WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

// --- stats ---
admin.get("/stats", async (c) => {
  const db = c.env.DB;
  const [perDay, totals, top, usage] = await Promise.all([
    db.prepare(
      `SELECT date(created_at, '+330 minutes') AS day, COUNT(*) AS chats,
         SUM(outcome = 'fixed') AS fixed, SUM(outcome = 'escalated') AS escalated
       FROM chats WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day DESC`,
    ).all(),
    db.prepare(`SELECT COUNT(*) AS chats, SUM(outcome = 'fixed') AS fixed, SUM(outcome = 'escalated') AS escalated FROM chats WHERE created_at >= datetime('now', '-30 days')`).first(),
    db.prepare(
      `SELECT c.guide_id, g.problem, COUNT(*) AS n FROM chats c LEFT JOIN guides g ON g.id = c.guide_id
       WHERE c.guide_id IS NOT NULL AND c.created_at >= datetime('now', '-30 days') GROUP BY c.guide_id ORDER BY n DESC LIMIT 10`,
    ).all(),
    db.prepare("SELECT * FROM usage ORDER BY day DESC LIMIT 14").all(),
  ]);
  return c.json({ perDay: perDay.results, totals, top: top.results, usage: usage.results, dailyCapUsd: Number(c.env.DAILY_AI_CAP_USD) });
});

app.route("/api/admin", admin);

app.notFound((c) => (c.req.path.startsWith("/api/") ? c.json({ error: "not_found" }, 404) : c.env.ASSETS.fetch(c.req.raw)));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Something went wrong. Please call iNK Fusion or request a technician." }, 500);
});

/* ===================== Scheduled clean-up ===================== */

async function cleanup(env: Env) {
  const months = Math.max(1, Number(env.RETENTION_MONTHS) || 24);
  const cutoff = `-${months} months`;
  const old = await env.DB.prepare("SELECT photo_key FROM tech_requests WHERE created_at < datetime('now', ?) AND photo_key IS NOT NULL").bind(cutoff).all<{ photo_key: string }>();
  for (const r of old.results) await env.FILES.delete(r.photo_key);
  // Customer photos that were uploaded but never attached to a request.
  const prefix = "private/customer/";
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  const cutoffDay = cutoffDate.toISOString().slice(0, 10);
  let cursor: string | undefined;
  do {
    const list = await env.FILES.list({ prefix, cursor });
    const stale = list.objects.filter((o) => o.key.slice(prefix.length, prefix.length + 10) < cutoffDay).map((o) => o.key);
    if (stale.length) await env.FILES.delete(stale);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM tech_requests WHERE created_at < datetime('now', ?)").bind(cutoff),
    env.DB.prepare("DELETE FROM chats WHERE created_at < datetime('now', ?)").bind(cutoff),
    env.DB.prepare("DELETE FROM ratelimit WHERE expires_at < ?").bind(Date.now()),
  ]);
}

export default {
  fetch: app.fetch,
  scheduled: (_e: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(cleanup(env)),
} satisfies ExportedHandler<Env>;

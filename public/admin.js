"use strict";
// iNK Fusion admin page: technician requests, fix guides, manuals/media, stats, QR codes.

const $ = (id) => document.getElementById(id);
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
async function api(path, opts = {}) {
  const init = { method: opts.method || (opts.body || opts.form ? "POST" : "GET"), headers: {} };
  if (opts.form) init.body = opts.form;
  else if (opts.body) { init.body = JSON.stringify(opts.body); init.headers["Content-Type"] = "application/json"; }
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/admin/login") { showLogin(); throw new Error(data.error || "Please log in."); }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
// Times are stored in UTC; show them in Sri Lanka time.
const fmt = (s) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" }) : "");
const MACHINE_NAMES = { dtf: "DTF printer", epson: "Epson printer", sublimation: "Sublimation printer", heatpress: "Heat press" };
const msgBox = (target, text, ok = true) => { $(target).replaceChildren(el("div", { class: `msgbox ${ok ? "ok" : "err"}` }, text)); };

/* ===================== login ===================== */
function showLogin() {
  $("app").hidden = true;
  $("logoutBtn").hidden = true;
  $("login").hidden = false;
  $("pw").focus();
}
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginErr").textContent = "";
  try {
    await api("/api/admin/login", { body: { password: $("pw").value } });
    $("pw").value = "";
    boot();
  } catch (ex) {
    $("loginErr").textContent = ex.message;
  }
});
$("logoutBtn").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" }).catch(() => {});
  showLogin();
});

/* ===================== tabs ===================== */
const loaders = { requests: loadRequests, guides: loadGuides, files: loadFiles, stats: loadStats, qr: loadQr };
function openTab(name) {
  document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  document.querySelectorAll("section[id^=tab-]").forEach((s) => (s.hidden = s.id !== "tab-" + name));
  loaders[name]();
}
document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => { history.replaceState(null, "", "#" + b.dataset.tab); openTab(b.dataset.tab); }));

/* ===================== requests ===================== */
let allRequests = [];
async function loadRequests() {
  allRequests = await api("/api/admin/requests");
  renderRequests();
}
$("reqFilter").addEventListener("change", renderRequests);
function renderRequests() {
  const f = $("reqFilter").value;
  const list = allRequests.filter((r) => !f || r.status === f);
  $("reqList").replaceChildren(
    ...(list.length ? list.map((r) =>
      el("div", { class: "item" },
        el("div", { class: "main" },
          el("div", {}, el("b", {}, r.name), " · ", el("a", { href: `tel:${r.phone}` }, r.phone), " · ", r.town),
          el("div", { class: "sub" }, `${fmt(r.created_at)} · ${MACHINE_NAMES[r.machine] || r.machine || "-"}${r.model ? " / " + r.model : ""} · warranty: ${r.warranty || "-"}`),
          el("div", { class: "sub" }, r.summary || ""),
        ),
        el("span", { class: `pill ${r.alert_status}`, title: r.alert_error || "" }, "WhatsApp: " + r.alert_status.replace("_", " ")),
        statusSelect(r),
        el("button", { class: "btn sm", onclick: () => showRequest(r.id) }, "View"),
      ))
    : [el("p", { class: "hint" }, "No technician requests yet.")]),
  );
}
function statusSelect(r) {
  const s = el("select", { class: "btn sm ghost", "aria-label": "Status" }, ["new", "contacted", "done"].map((v) => el("option", { value: v, selected: r.status === v }, v[0].toUpperCase() + v.slice(1))));
  s.addEventListener("change", async () => {
    await api(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { status: s.value } });
    r.status = s.value;
  });
  return s;
}
async function showRequest(id) {
  const { request: r, chat } = await api(`/api/admin/requests/${id}`);
  const transcript = chat ? JSON.parse(chat.transcript || "[]") : [];
  $("reqDetail").replaceChildren(
    el("div", { class: "card" },
      el("div", { class: "row" }, el("h3", { style: "flex:1" }, `Request from ${r.name}`), el("button", { class: "btn sm ghost", onclick: () => $("reqDetail").replaceChildren() }, "Close")),
      el("p", {}, `📞 `, el("a", { href: `tel:${r.phone}` }, r.phone), ` · ${r.town} · ${fmt(r.created_at)}`),
      el("p", {}, `Machine: ${MACHINE_NAMES[r.machine] || r.machine || "-"} ${r.model ? "/ " + r.model : ""} · Warranty: ${r.warranty || "-"}`),
      el("p", {}, `Problem: ${r.summary || "-"}`),
      r.steps_tried ? el("div", {}, el("b", {}, "Steps tried:"), el("pre", { style: "white-space:pre-wrap;font:inherit" }, r.steps_tried)) : null,
      r.alert_error ? el("div", { class: "msgbox err" }, "WhatsApp error: " + r.alert_error) : null,
      r.photo_key ? el("a", { href: `/media/${r.photo_key}`, target: "_blank" }, el("img", { src: `/media/${r.photo_key}`, alt: "Customer photo", style: "max-width:100%;max-height:360px;border-radius:12px;margin:8px 0" })) : el("p", { class: "hint" }, "No photo."),
      el("h3", {}, "Chat transcript"),
      el("div", { class: "transcript" }, transcript.length ? transcript.map((m) => el("div", { class: `msg ${m.from === "user" ? "user" : "bot"}` }, m.text)) : el("p", { class: "hint" }, "No chat saved.")),
    ),
  );
  $("reqDetail").scrollIntoView({ behavior: "smooth" });
}

/* ===================== guides ===================== */
const NEW_GUIDE = `id: my-new-guide
machine: dtf            # dtf | epson | sublimation | heatpress (or a list: [dtf, epson])
problem: Short name of the problem
ask_first:              # optional questions before step 1 (delete if not needed)
  - "Which software do you use?"
safety: "Safety note shown before the steps."
steps:
  - text: "First step, one instruction only."
  - text: "Second step."
    media: /media/public/media/...   # optional photo/video (copy from Manuals & media)
max_attempts_before_escalation: 2
escalate_if:
  - "When to stop and call a technician"
prevention_tip: "How to stop it happening again."
status: draft           # draft | approved
owner_check: []
`;
async function loadGuides() {
  const rows = await api("/api/admin/guides");
  const approved = rows.filter((g) => g.status === "approved").length;
  $("guideList").replaceChildren(
    el("p", { class: "hint" }, `${approved} of ${rows.length} guides approved.`),
    ...rows.map((g) =>
      el("div", { class: "item" },
        el("div", { class: "main" }, el("b", {}, g.problem), el("div", { class: "sub" }, `${JSON.parse(g.machine).map((m) => MACHINE_NAMES[m] || m).join(", ")} · ${g.id} · updated ${fmt(g.updated_at)}`)),
        el("span", { class: `pill ${g.status}` }, g.status),
        el("button", { class: "btn sm", onclick: () => editGuide(g.id) }, "Edit"),
      ),
    ),
  );
}
async function editGuide(id) {
  const isNew = !id;
  const g = isNew ? { yaml: NEW_GUIDE, status: "draft" } : await api(`/api/admin/guides/${id}`);
  const ta = el("textarea", { class: "yaml", spellcheck: "false", "aria-label": "Guide YAML" });
  ta.value = g.yaml;
  const close = () => $("guideEditor").replaceChildren();
  const save = async () => {
    try {
      const r = isNew ? await api("/api/admin/guides", { body: { yaml: ta.value } }) : await api(`/api/admin/guides/${id}`, { method: "PUT", body: { yaml: ta.value } });
      msgBox("guideMsg", `Saved "${r.id}".`);
      close();
      loadGuides();
    } catch (ex) { msgBox("guideMsg", ex.message, false); }
  };
  const setStatus = async (status) => {
    try {
      await api(`/api/admin/guides/${id}`, { method: "PUT", body: { yaml: ta.value } });
      await api(`/api/admin/guides/${id}/status`, { body: { status } });
      msgBox("guideMsg", status === "approved" ? `Approved "${id}". It is now live in the chat.` : `"${id}" set to draft. It is no longer used in the chat.`);
      close();
      loadGuides();
    } catch (ex) { msgBox("guideMsg", ex.message, false); }
  };
  const del = async () => {
    if (!confirm(`Delete the guide "${id}"? This cannot be undone.`)) return;
    await api(`/api/admin/guides/${id}`, { method: "DELETE" });
    msgBox("guideMsg", `Deleted "${id}".`);
    close();
    loadGuides();
  };
  $("guideMsg").replaceChildren();
  $("guideEditor").replaceChildren(
    el("div", { class: "card" },
      el("div", { class: "row" }, el("h3", { style: "flex:1" }, isNew ? "New guide" : `Edit: ${id}`), !isNew ? el("span", { class: `pill ${g.status}` }, g.status) : null),
      ta,
      el("div", { class: "row", style: "margin-top:10px" },
        el("button", { class: "btn sm primary", onclick: save }, "💾 Save"),
        !isNew && g.status !== "approved" ? el("button", { class: "btn sm yes", onclick: () => setStatus("approved") }, "✅ Save & approve") : null,
        !isNew && g.status === "approved" ? el("button", { class: "btn sm", onclick: () => setStatus("draft") }, "↩️ Set to draft") : null,
        el("button", { class: "btn sm ghost", onclick: close }, "Cancel"),
        !isNew ? el("button", { class: "btn sm no", onclick: del }, "🗑️ Delete") : null,
      ),
    ),
  );
  $("guideEditor").scrollIntoView({ behavior: "smooth" });
}
$("newGuideBtn").addEventListener("click", () => editGuide(null));
$("guideUpload").addEventListener("change", async (e) => {
  const fd = new FormData();
  for (const f of e.target.files) fd.append("files", f);
  e.target.value = "";
  try {
    const { results } = await api("/api/admin/guides/upload", { form: fd });
    const bad = results.filter((r) => !r.ok);
    $("guideMsg").replaceChildren(
      el("div", { class: `msgbox ${bad.length ? "err" : "ok"}` },
        `Uploaded ${results.length - bad.length} of ${results.length} guide file(s).`,
        bad.length ? el("ul", {}, bad.map((r) => el("li", {}, `${r.file}: ${r.error}`))) : null),
    );
    loadGuides();
  } catch (ex) { msgBox("guideMsg", ex.message, false); }
});

/* ===================== files ===================== */
async function loadFiles() {
  const rows = await api("/api/admin/files");
  $("fileList").replaceChildren(
    ...(rows.length ? rows.map((f) => {
      const href = f.url || `/media/${f.r2_key}`;
      const mediaValue = f.kind === "pdf" ? null : href;
      return el("div", { class: "item" },
        el("div", { class: "main" },
          el("b", {}, f.name),
          el("div", { class: "sub" }, `${f.kind.toUpperCase()} · ${fmt(f.created_at)}${f.size ? " · " + (f.size / 1048576).toFixed(1) + " MB" : ""}`),
          mediaValue ? el("div", { class: "sub" }, "media: ", el("code", {}, mediaValue)) : el("div", { class: "sub" }, "Private manual (admin only)"),
        ),
        mediaValue ? el("button", { class: "btn sm", onclick: (e) => { navigator.clipboard.writeText(mediaValue); e.target.textContent = "Copied ✅"; } }, "Copy media") : null,
        el("a", { class: "btn sm ghost", href, target: "_blank", rel: "noopener" }, "Open"),
        el("button", { class: "btn sm no", onclick: async () => { if (confirm(`Delete "${f.name}"?`)) { await api(`/api/admin/files/${f.id}`, { method: "DELETE" }); loadFiles(); } } }, "Delete"),
      );
    }) : [el("p", { class: "hint" }, "No files yet. Upload your manuals, error-code sheets, photos and videos above.")]),
  );
}
$("fileUpload").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  let ok = 0;
  const errors = [];
  for (const f of files) {
    msgBox("fileMsg", `Uploading ${f.name}…`);
    const fd = new FormData();
    fd.append("file", f);
    try { await api("/api/admin/files", { form: fd }); ok++; } catch (ex) { errors.push(`${f.name}: ${ex.message}`); }
  }
  $("fileMsg").replaceChildren(el("div", { class: `msgbox ${errors.length ? "err" : "ok"}` }, `Uploaded ${ok} of ${files.length}.`, errors.length ? el("ul", {}, errors.map((x) => el("li", {}, x))) : null));
  loadFiles();
});
$("linkForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/admin/files/link", { body: { name: $("linkName").value, url: $("linkUrl").value.trim() } });
    $("linkName").value = $("linkUrl").value = "";
    msgBox("fileMsg", "Link added.");
    loadFiles();
  } catch (ex) { msgBox("fileMsg", ex.message, false); }
});

/* ===================== stats ===================== */
async function loadStats() {
  const s = await api("/api/admin/stats");
  const total = s.totals.chats || 0;
  const pct = (n) => (total ? Math.round(((n || 0) / total) * 100) + "%" : "–");
  const today = s.usage[0];
  $("statsBox").replaceChildren(
    el("div", { class: "stats" },
      el("div", { class: "stat" }, el("b", {}, total), el("span", {}, "Chats")),
      el("div", { class: "stat" }, el("b", {}, pct(s.totals.fixed)), el("span", {}, "Fixed by customer")),
      el("div", { class: "stat" }, el("b", {}, pct(s.totals.escalated)), el("span", {}, "Escalated")),
      el("div", { class: "stat" }, el("b", {}, today ? `$${today.cost_usd.toFixed(2)}` : "$0.00"), el("span", {}, `AI cost latest day (cap $${s.dailyCapUsd})`)),
    ),
    el("h3", {}, "Top problems"),
    s.top.length ? el("div", { class: "table-wrap" }, el("table", {}, el("tr", {}, el("th", {}, "Problem"), el("th", {}, "Chats")), s.top.map((r) => el("tr", {}, el("td", {}, r.problem || r.guide_id), el("td", {}, r.n))))) : el("p", { class: "hint" }, "No data yet."),
    el("h3", {}, "Chats per day"),
    s.perDay.length ? el("div", { class: "table-wrap" }, el("table", {}, el("tr", {}, el("th", {}, "Day"), el("th", {}, "Chats"), el("th", {}, "Fixed"), el("th", {}, "Escalated")), s.perDay.map((r) => el("tr", {}, el("td", {}, r.day), el("td", {}, r.chats), el("td", {}, r.fixed || 0), el("td", {}, r.escalated || 0))))) : el("p", { class: "hint" }, "No chats yet."),
    el("h3", {}, "AI usage"),
    s.usage.length ? el("div", { class: "table-wrap" }, el("table", {}, el("tr", {}, el("th", {}, "Day"), el("th", {}, "AI calls"), el("th", {}, "Cost (USD, estimate)")), s.usage.map((r) => el("tr", {}, el("td", {}, r.day), el("td", {}, r.ai_calls), el("td", {}, "$" + r.cost_usd.toFixed(3)))))) : el("p", { class: "hint" }, "No AI usage yet."),
  );
}

/* ===================== QR codes ===================== */
function loadQr() {
  const grid = $("qrGrid");
  grid.replaceChildren();
  for (const [m, name] of Object.entries(MACHINE_NAMES)) {
    const url = `${location.origin}/?machine=${m}`;
    const code = el("div", { class: "code" });
    grid.append(el("div", { class: "qr" }, el("b", {}, "iNK Fusion Breakdown Help"), el("div", {}, name), code, el("div", {}, "Scan for help"), el("small", {}, url)));
    if (window.qrcode) {
      const qr = window.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      code.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true, alt: `QR code for ${name}` });
      code.firstElementChild.style.width = "180px";
    } else code.append(el("p", {}, "QR library could not load. Use the link below."));
  }
}

/* ===================== boot ===================== */
async function boot() {
  let me;
  try {
    me = await api("/api/admin/me");
  } catch {
    return;
  }
  $("login").hidden = true;
  $("app").hidden = false;
  $("logoutBtn").hidden = false;
  const notes = [];
  if (!me.aiEnabled) notes.push("AI is off: add the ANTHROPIC_API_KEY secret in Cloudflare. Until then, customers can use the buttons but not typed questions or Sinhala/Tamil translation of guides.");
  if (!me.whatsappEnabled) notes.push("WhatsApp alerts are off: add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Cloudflare. Requests are still saved here.");
  $("setupNotes").replaceChildren(...notes.map((n) => el("div", { class: "msgbox err" }, "⚙️ " + n)));
  const hash = location.hash.slice(1);
  if (hash.startsWith("request=")) {
    openTab("requests");
    showRequest(hash.slice(8));
  } else openTab(loaders[hash] ? hash : "requests");
}
boot();

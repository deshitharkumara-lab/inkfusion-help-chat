import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Env } from "./env";

const COOKIE = "ink_admin";
const MAX_AGE = 7 * 24 * 3600;

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function login(c: Context<{ Bindings: Env }>, password: string): Promise<boolean> {
  const secret = c.env.ADMIN_PASSWORD;
  if (!secret) return false;
  // Compare hashes so the comparison time does not depend on the password length.
  if (!safeEqual(await hmac("cmp", password), await hmac("cmp", secret))) return false;
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  setCookie(c, COOKIE, `${exp}.${await hmac(secret, exp)}`, { httpOnly: true, secure: true, sameSite: "Strict", path: "/", maxAge: MAX_AGE });
  return true;
}

export function logout(c: Context) {
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const secret = c.env.ADMIN_PASSWORD;
  const v = getCookie(c, COOKIE);
  if (secret && v) {
    const [exp, sig] = v.split(".");
    if (Number(exp) > Date.now() / 1000 && sig && safeEqual(sig, await hmac(secret, exp))) return next();
  }
  return c.json({ error: secret ? "Please log in." : "ADMIN_PASSWORD is not set in Cloudflare yet." }, 401);
}

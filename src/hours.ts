import type { Env } from "./env";

const COLOMBO_OFFSET_MIN = 330; // Asia/Colombo is UTC+5:30 all year (no daylight saving)

export function colomboNow(d = new Date()) {
  const t = new Date(d.getTime() + COLOMBO_OFFSET_MIN * 60_000);
  return {
    day: t.getUTCDay(), // 0 = Sunday
    minutes: t.getUTCHours() * 60 + t.getUTCMinutes(),
    date: t.toISOString().slice(0, 10),
  };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function isOpen(env: Env, d = new Date()): boolean {
  const now = colomboNow(d);
  const days = env.BUSINESS_DAYS.split(",").map((s) => Number(s.trim()));
  return days.includes(now.day) && now.minutes >= toMin(env.BUSINESS_OPEN) && now.minutes < toMin(env.BUSINESS_CLOSE);
}

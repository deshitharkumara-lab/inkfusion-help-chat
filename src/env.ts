export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ASSETS: Fetcher;
  // Secrets (set in the Cloudflare dashboard, never in GitHub)
  ANTHROPIC_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  // Settings (wrangler.jsonc "vars")
  CALL_NUMBER: string;
  CALL_NUMBER_DISPLAY: string;
  ALERT_WHATSAPP_NUMBER: string;
  BUSINESS_DAYS: string;
  BUSINESS_OPEN: string;
  BUSINESS_CLOSE: string;
  DAILY_AI_CAP_USD: string;
  CLAUDE_MODEL: string;
  PRICE_INPUT_PER_MTOK: string;
  PRICE_OUTPUT_PER_MTOK: string;
  AI_CALLS_PER_HOUR_PER_IP: string;
  RETENTION_MONTHS: string;
  WHATSAPP_API_VERSION: string;
  WHATSAPP_TEMPLATE_NAME: string;
  WHATSAPP_TEMPLATE_LANG: string;
}

export const MACHINES = ["dtf", "epson", "sublimation", "heatpress"] as const;
export type Machine = (typeof MACHINES)[number];

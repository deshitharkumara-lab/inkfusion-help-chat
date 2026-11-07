import type { Env } from "./env";

export interface AlertInfo {
  name: string;
  phone: string;
  town: string;
  machine: string;
  model: string;
  warranty: string;
  summary: string;
  photoUrl: string | null;
  adminUrl: string;
}

/**
 * Sends the technician-request alert to the owner through the WhatsApp Business Cloud API.
 * Returns "sent", "not_configured", or throws with the API error.
 *
 * Note: WhatsApp only allows free-form text if the owner messaged the business number in the
 * last 24 hours. For reliable alerts, create an approved message template in Meta with ONE body
 * variable ({{1}}) and set WHATSAPP_TEMPLATE_NAME. See SETUP.md.
 */
export async function sendAlert(env: Env, a: AlertInfo): Promise<"sent" | "not_configured"> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return "not_configured";
  const lines = [
    `New technician request`,
    `Name: ${a.name}`,
    `Phone: ${a.phone}`,
    `Town: ${a.town}`,
    `Machine: ${a.machine}${a.model ? " / " + a.model : ""}`,
    `Warranty: ${a.warranty || "not given"}`,
    `Problem: ${a.summary}`,
    a.photoUrl ? `Photo: ${a.photoUrl}` : `Photo: none`,
    `Full chat: ${a.adminUrl}`,
  ];
  const body = env.WHATSAPP_TEMPLATE_NAME
    ? {
        messaging_product: "whatsapp",
        to: env.ALERT_WHATSAPP_NUMBER,
        type: "template",
        template: {
          name: env.WHATSAPP_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_TEMPLATE_LANG || "en" },
          // Template variables cannot contain new lines, so the details are joined with " | ".
          components: [{ type: "body", parameters: [{ type: "text", text: lines.slice(1).join(" | ").slice(0, 1000) }] }],
        },
      }
    : { messaging_product: "whatsapp", to: env.ALERT_WHATSAPP_NUMBER, type: "text", text: { body: lines.join("\n") } };

  const res = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return "sent";
}

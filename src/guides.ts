import YAML from "yaml";
import { z } from "zod";
import { MACHINES } from "./env";

const machineEnum = z.enum(MACHINES);

export const GuideSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id: use lowercase letters, numbers and dashes only"),
  machine: z.union([machineEnum, z.array(machineEnum).min(1)]),
  problem: z.string().min(3),
  ask_first: z.array(z.string()).optional(),
  safety: z.string().optional(),
  steps: z.array(z.object({ text: z.string().min(1), media: z.string().nullish() })).min(1),
  max_attempts_before_escalation: z.number().int().min(1).optional(),
  escalate_if: z.array(z.string()).default([]),
  prevention_tip: z.string().optional(),
  status: z.enum(["draft", "approved"]),
  owner_check: z.array(z.string()).nullish(),
});
export type Guide = z.infer<typeof GuideSchema>;

export function machinesOf(g: Guide): string[] {
  return Array.isArray(g.machine) ? g.machine : [g.machine];
}

/** Parse and validate guide YAML. Throws an Error with a readable message. */
export function parseGuide(src: string): Guide {
  let raw: unknown;
  try {
    raw = YAML.parse(src);
  } catch (e) {
    throw new Error("YAML format error: " + (e as Error).message);
  }
  const r = GuideSchema.safeParse(raw);
  if (!r.success) {
    throw new Error(r.error.issues.map((i) => `${i.path.join(".") || "guide"}: ${i.message}`).join("; "));
  }
  if (r.data.status === "approved" && r.data.owner_check && r.data.owner_check.length > 0) {
    throw new Error("This guide still has owner_check questions. Answer and remove them before approving.");
  }
  return r.data;
}

/** Return YAML with the status field changed, keeping the rest of the file as written. */
export function setStatusInYaml(src: string, status: "draft" | "approved"): string {
  if (/^status:.*$/m.test(src)) return src.replace(/^status:.*$/m, `status: ${status}`);
  return src.trimEnd() + `\nstatus: ${status}\n`;
}

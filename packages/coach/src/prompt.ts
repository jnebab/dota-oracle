import { MODULES } from "./catalog";
import { MAX_MODULES, eligibleModuleIds } from "./rules";
import type { DraftContext } from "./types";

export const COACH_SYSTEM_PROMPT = [
  "You are a concise Dota 2 draft coach.",
  "You are given the current draft state and a list of ALLOWED module ids.",
  "Choose and order the most relevant modules (most urgent first) and write a one-sentence headline.",
  "Rules:",
  "- Only use ids from the allowed list. Never invent ids.",
  `- Return at most ${MAX_MODULES} modules.`,
  "- Each module: { id, urgency: high|med|low, note } where note is <= 12 words of concrete advice.",
  "- Base everything strictly on the provided state. Do not invent heroes or items.",
  "- Output JSON only, no prose, no code fences.",
].join("\n");

/** Compact, model-friendly view of the context (keeps the prompt small). */
function stateSummary(c: DraftContext) {
  return {
    role: c.role,
    rank: c.rank,
    topPick: c.topPick
      ? { name: c.topPick.name, tier: c.topPick.tier, score: Math.round(c.topPick.total * 10) / 10 }
      : null,
    alternatives: c.alternatives.map((a) => a.name),
    enemies: c.enemies.map((e) => e.name),
    signals: c.signals,
    threats: c.threats.map((t) => `${t.name} (${t.severity})`),
    bans: c.bans.map((b) => b.name),
    synergyAllies: c.synergyAllies.map((s) => s.name),
    contestedRole: c.contestedRole,
  };
}

export function buildUserPrompt(c: DraftContext): string {
  const allowed = eligibleModuleIds(c)
    .map((id) => `- ${id}: ${MODULES[id].title}`)
    .join("\n");
  return [
    "Draft state:",
    JSON.stringify(stateSummary(c)),
    "",
    "Allowed module ids:",
    allowed,
    "",
    'Return JSON: {"headline": string, "modules": [{"id": string, "urgency": "high"|"med"|"low", "note": string}]}',
  ].join("\n");
}

/** JSON Schema for runtimes that support structured output (Prompt API responseConstraint). */
export const COACH_RESPONSE_SCHEMA = {
  type: "object",
  required: ["headline", "modules"],
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    modules: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "urgency"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          urgency: { type: "string", enum: ["high", "med", "low"] },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

import { z } from "zod";
import { MODULES } from "./catalog";
import {
  eligibleModuleIds,
  finalizeModules,
  mandatoryModuleIds,
  selectModulesRules,
} from "./rules";
import type { CoachBrief, CoachModule, DraftContext, ModuleId } from "./types";

const urgencySchema = z.enum(["high", "med", "low"]);

// `id` is a free string here so one unknown id doesn't reject the whole payload;
// it's filtered against the eligible catalog set below.
export const coachBriefSchema = z.object({
  headline: z.string(),
  modules: z.array(
    z.object({ id: z.string(), urgency: urgencySchema, note: z.string().optional() }),
  ),
});

const clamp = (s: string, max: number) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/** Pull a JSON object out of a model response (tolerates code fences / prose). */
function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * Validate + sanitize a model's coach output against the closed catalog, then
 * apply the safety floor: every mandatory module is force-included regardless of
 * what the AI returned, unknown/ineligible ids are dropped, and an empty result
 * falls back to the deterministic rules. The AI can reorder + annotate, never
 * suppress a critical module or invent one.
 */
export function parseCoachBrief(raw: string, ctx: DraftContext): CoachBrief {
  const parsed = coachBriefSchema.parse(extractJson(raw)); // throws → caller falls back

  const eligible = new Set<string>(eligibleModuleIds(ctx));
  const seen = new Set<ModuleId>();
  const modules: CoachModule[] = [];
  for (const m of parsed.modules) {
    if (!eligible.has(m.id) || seen.has(m.id as ModuleId)) continue;
    const id = m.id as ModuleId;
    seen.add(id);
    modules.push({ id, urgency: m.urgency, note: m.note ? clamp(m.note, 120) : undefined });
  }

  // Safety floor — mandatory modules can't be hidden by the model.
  for (const id of mandatoryModuleIds(ctx)) {
    if (!seen.has(id)) {
      seen.add(id);
      modules.push({ id, urgency: "high", note: MODULES[id].detail(ctx) });
    }
  }

  if (modules.length === 0) return selectModulesRules(ctx);

  const headline = clamp(parsed.headline, 200) || selectModulesRules(ctx).headline;
  // finalizeModules normalizes mandatory urgency to high and exempts them from
  // the cap, so the AI can never demote/hide a safety-critical module.
  return { headline, modules: finalizeModules(modules, ctx), source: "ai" };
}

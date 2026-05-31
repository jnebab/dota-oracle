import { MODULES, MODULE_ORDER } from "./catalog";
import type { CoachBrief, CoachModule, DraftContext, ModuleId, Urgency } from "./types";

export const MAX_MODULES = 5;
export const URGENCY_RANK: Record<Urgency, number> = { high: 3, med: 2, low: 1 };

export function eligibleModuleIds(c: DraftContext): ModuleId[] {
  return MODULE_ORDER.filter((id) => MODULES[id].eligibleWhen(c));
}

export function mandatoryModuleIds(c: DraftContext): ModuleId[] {
  return MODULE_ORDER.filter((id) => MODULES[id].mandatoryWhen?.(c) ?? false);
}

/** Order eligible modules by urgency, then catalog priority; cap to MAX_MODULES. */
export function orderModules(modules: CoachModule[]): CoachModule[] {
  const priority = new Map(MODULE_ORDER.map((id, i) => [id, i]));
  return [...modules]
    .sort(
      (a, b) =>
        URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] ||
        (priority.get(a.id) ?? 99) - (priority.get(b.id) ?? 99),
    )
    .slice(0, MAX_MODULES);
}

export function headlineFor(c: DraftContext): string {
  const s = c.signals;
  const pick = c.topPick?.name ?? "your pick";
  if (c.enemies.length === 0) return "Add the enemy lineup to get matchup-tuned coaching.";
  if (c.contestedRole)
    return `Your ${c.role} looks contested — confirm who flexes, then commit to ${pick}.`;
  if (s.magic >= 2) return `Magic-heavy enemy — ${pick} needs BKB on time; don't fight early.`;
  if (s.tanky >= 2)
    return `Tanky enemy — break passives and bring armour to grind out fights on ${pick}.`;
  if (s.evasion) return `Enemy evasion — ${pick} wants Monkey King Bar to connect.`;
  if (s.heal >= 2) return `Heavy enemy sustain — pick up healing reduction on ${pick}.`;
  return `${pick} is your best pick — here's how to make it land.`;
}

/** Deterministic baseline + universal fallback. */
export function selectModulesRules(c: DraftContext): CoachBrief {
  const modules: CoachModule[] = eligibleModuleIds(c).map((id) => ({
    id,
    urgency: MODULES[id].baseUrgency(c),
    note: MODULES[id].detail(c),
  }));
  return { headline: headlineFor(c), modules: orderModules(modules), source: "rules" };
}

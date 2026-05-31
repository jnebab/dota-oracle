import type { DraftContext, ModuleId, Urgency } from "./types";

export interface ModuleSpec {
  id: ModuleId;
  title: string;
  icon: string;
  /** May this module ever appear for the given context? */
  eligibleWhen: (c: DraftContext) => boolean;
  /** Must this module appear (safety floor) — AI can't suppress it. */
  mandatoryWhen?: (c: DraftContext) => boolean;
  /** Rules-tier urgency. */
  baseUrgency: (c: DraftContext) => Urgency;
  /** Rules-tier one-liner (AI may override with its own note). */
  detail: (c: DraftContext) => string;
}

const names = (xs: { name: string }[]) => xs.map((x) => x.name).join(", ");
const squishyFarmer = (c: DraftContext) =>
  !!c.topPick && !c.topPick.tags.includes("tanky") && !c.topPick.tags.includes("mobility");

/** Catalog order doubles as the tie-break priority (earlier = higher). */
export const MODULE_ORDER: ModuleId[] = [
  "role-contested",
  "bkb-timing",
  "mkb-evasion",
  "break-passives",
  "survive-early",
  "anti-heal",
  "dispel-silence",
  "cleave-illusions",
  "threats",
  "ban-warning",
  "lane-matchup",
  "synergy-highlight",
  "comfort-pick",
  "item-plan",
];

export const MODULES: Record<ModuleId, ModuleSpec> = {
  "bkb-timing": {
    id: "bkb-timing",
    title: "BKB timing",
    icon: "⏱",
    eligibleWhen: (c) => c.signals.magic >= 1 || c.signals.lockdown >= 2,
    mandatoryWhen: (c) => c.signals.magic >= 2 || c.signals.lockdown >= 3,
    baseUrgency: (c) => (c.signals.magic >= 2 || c.signals.lockdown >= 3 ? "high" : "med"),
    detail: (c) =>
      `${c.signals.magic} magic / ${c.signals.lockdown} disables — buy Black King Bar before you commit.`,
  },
  "survive-early": {
    id: "survive-early",
    title: "Survive early",
    icon: "🛡",
    eligibleWhen: (c) => squishyFarmer(c) && (c.signals.magic >= 2 || c.signals.lockdown >= 2),
    baseUrgency: (c) => (c.signals.magic >= 3 ? "high" : "med"),
    detail: () => "Squishy farmer vs burst — farm safe and avoid fights until your key timing.",
  },
  "break-passives": {
    id: "break-passives",
    title: "Break passives",
    icon: "🗡",
    eligibleWhen: (c) => c.signals.tanky >= 2,
    mandatoryWhen: (c) => c.signals.tanky >= 3,
    baseUrgency: (c) => (c.signals.tanky >= 3 ? "high" : "med"),
    detail: (c) =>
      `${c.signals.tanky} tanky cores — Silver Edge to break, Assault Cuirass to shred.`,
  },
  "mkb-evasion": {
    id: "mkb-evasion",
    title: "MKB vs evasion",
    icon: "🎯",
    eligibleWhen: (c) => c.signals.evasion,
    mandatoryWhen: (c) => c.signals.evasion,
    baseUrgency: () => "high",
    detail: () => "Enemy evasion — Monkey King Bar restores true strike.",
  },
  "anti-heal": {
    id: "anti-heal",
    title: "Cut their healing",
    icon: "💉",
    eligibleWhen: (c) => c.signals.heal >= 2,
    mandatoryWhen: (c) => c.signals.heal >= 3,
    baseUrgency: (c) => (c.signals.heal >= 3 ? "high" : "med"),
    detail: () => "Heavy heal / lifesteal — Eye of Skadi or Spirit Vessel cuts it.",
  },
  "dispel-silence": {
    id: "dispel-silence",
    title: "Dispel silences",
    icon: "🌀",
    eligibleWhen: (c) => c.signals.silence,
    baseUrgency: () => "med",
    detail: () => "Enemy silences — Manta Style dispels them off you.",
  },
  "cleave-illusions": {
    id: "cleave-illusions",
    title: "Clear illusions",
    icon: "⚔",
    eligibleWhen: (c) => c.signals.illuSummon,
    baseUrgency: () => "med",
    detail: () => "Illusions / summons — Battlefury or Mjollnir cleaves them down.",
  },
  "lane-matchup": {
    id: "lane-matchup",
    title: "Lane matchup",
    icon: "🛣",
    eligibleWhen: (c) => !!c.topPick?.id && laneOpponents(c).length > 0,
    baseUrgency: () => "low",
    detail: (c) => `Your lane vs ${names(laneOpponents(c))}.`,
  },
  "ban-warning": {
    id: "ban-warning",
    title: "Consider banning",
    icon: "🚫",
    eligibleWhen: (c) => c.bans.length > 0,
    baseUrgency: () => "med",
    detail: (c) => `${names(c.bans)} — counters your pool.`,
  },
  "synergy-highlight": {
    id: "synergy-highlight",
    title: "Team synergy",
    icon: "🤝",
    eligibleWhen: (c) => c.synergyAllies.length > 0,
    baseUrgency: () => "low",
    detail: (c) => `Combos with ${names(c.synergyAllies)}.`,
  },
  "role-contested": {
    id: "role-contested",
    title: "Role contested",
    icon: "⚠",
    eligibleWhen: (c) => c.contestedRole,
    mandatoryWhen: (c) => c.contestedRole,
    baseUrgency: () => "high",
    detail: (c) => `A teammate is also marked ${c.role} — sort out who flexes.`,
  },
  "comfort-pick": {
    id: "comfort-pick",
    title: "Comfort pick",
    icon: "🌟",
    eligibleWhen: (c) => c.bracketFactor === 1 && !!c.topPick,
    baseUrgency: () => "low",
    detail: () => "Forgiving, self-sufficient pick for this bracket.",
  },
  threats: {
    id: "threats",
    title: "Threats to your pick",
    icon: "☠",
    eligibleWhen: (c) => c.threats.length > 0,
    mandatoryWhen: (c) => c.threats.some((t) => t.severity === "high"),
    baseUrgency: (c) => (c.threats.some((t) => t.severity === "high") ? "high" : "med"),
    detail: (c) => `Watch out for ${names(c.threats)}.`,
  },
  "item-plan": {
    id: "item-plan",
    title: "Core build path",
    icon: "🪙",
    eligibleWhen: () => true,
    baseUrgency: () => "low",
    detail: (c) => `Core build path for ${c.topPick?.name ?? "your pick"}.`,
  },
};

/** Heroes laning against the player's pick (pos 1↔3 / 2↔2 / 4↔5 heuristics). */
export function laneOpponents(c: DraftContext): { id: string; name: string }[] {
  const pos = c.topPick && c.allies.find((a) => a.id === c.topPick?.id)?.pos;
  if (!pos) return [];
  const opp: Record<string, string[]> = {
    Carry: ["Offlane", "Hard Support"],
    "Hard Support": ["Carry", "Offlane"],
    Offlane: ["Carry", "Support"],
    Support: ["Offlane", "Mid"],
    Mid: ["Mid"],
  };
  const want = opp[pos] ?? [];
  return c.enemies
    .filter((e) => e.pos && want.includes(e.pos))
    .map((e) => ({ id: e.id, name: e.name }));
}

import type { BracketFit } from "./types";

/** Rank ladder, low → high. */
export const RANKS = [
  "Herald",
  "Guardian",
  "Crusader",
  "Archon",
  "Legend",
  "Ancient",
  "Divine",
  "Immortal",
] as const;

export type Rank = (typeof RANKS)[number];

/**
 * Low-bracket friendliness weights. Crusader–Archon pubs reward forgiving,
 * self-sufficient, snowbally carries and punish high-skill-ceiling heroes.
 * The engine applies these scaled by {@link bracketFactorFor}.
 */
export const BRACKET_FIT: Record<string, BracketFit> = {
  "wraith-king": { w: 1.5, note: "Crusader/Archon wrecking ball — tanky & forgiving" },
  "phantom-assassin": { w: 1.5, note: "pubstomper — crits & evasion punish low brackets" },
  lifestealer: { w: 1.5, note: "super forgiving — Rage is a built-in BKB" },
  sven: { w: 1.5, note: "low-bracket monster — Cleave crits one-shot" },
  juggernaut: { w: 1, note: "easy & self-sufficient — great at this rank" },
  "drow-ranger": { w: 1, note: "right-click bully vs disorganized pubs" },
  sniper: { w: 1, note: "safe-range damage thrives in scrappy games" },
  luna: { w: 1, note: "simple cleave farmer, strong at this rank" },
  spectre: { w: 1, note: "long games & loose map play feed her comebacks" },
  ursa: { w: 1, note: "simple & snowbally — great at this rank" },
  "troll-warlord": { w: 1, note: "lane bully that stomps pubs" },
  "chaos-knight": { w: 0.5, note: "early-mid illusion spike stomps pubs" },
  medusa: { w: 0.5, note: "tanky & forgiving, but slow to come online" },
  slark: { w: 0.5, note: "snowbally, but punishes mistimed fights" },
  necrophos: { w: 0.5, note: "tanky caster-core, simple to pilot" },
  terrorblade: { w: -0.5, note: "illusion management trips up low brackets" },
  "templar-assassin": { w: -1, note: "positioning-heavy, easy to misplay here" },
  "faceless-void": { w: -1.5, note: "high skill ceiling — Chrono is easy to whiff here" },
  kez: { w: -1.5, note: "mechanically demanding & new — hard to pilot at this rank" },
  morphling: { w: -2, note: "very hard to execute below high MMR" },
  meepo: { w: -2.5, note: "extreme micro — avoid until Ancient+" },
};

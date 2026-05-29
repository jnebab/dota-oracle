import { CORE_BUILDS, FALLBACK_BUILD, type Hero } from "@dota-oracle/data";
import { has } from "./tags";
import type { BuildGuide, LineupSignals, SituationalItem } from "./types";

/** Aggregate threat signals from the enemy lineup. */
export function lineupSignals(enemies: Hero[]): LineupSignals {
  const s: LineupSignals = {
    magic: 0,
    phys: 0,
    tanky: 0,
    lockdown: 0,
    evasion: false,
    illuSummon: false,
    silence: false,
    invis: false,
    heal: 0,
  };
  for (const e of enemies) {
    if (has(e, "magic-burst") || has(e, "spell-reliant")) s.magic++;
    if (has(e, "physical-dps")) s.phys++;
    if (has(e, "tanky")) s.tanky++;
    if (has(e, "lockdown") || has(e, "aoe-disable")) s.lockdown++;
    if (has(e, "evasion")) s.evasion = true;
    if (has(e, "illusion") || has(e, "summon")) s.illuSummon = true;
    if (has(e, "silence")) s.silence = true;
    if (has(e, "invis")) s.invis = true;
    if (has(e, "heal")) s.heal++;
  }
  return s;
}

const BATTLE_FURY_CARRIES = new Set([
  "phantom-assassin",
  "faceless-void",
  "wraith-king",
  "ursa",
  "troll-warlord",
  "anti-mage",
]);

/** Top situational items (max 4) tuned to the enemy lineup. */
export function situationalItems(hero: Hero, enemies: Hero[]): SituationalItem[] {
  const s = lineupSignals(enemies);
  const out: SituationalItem[] = [];

  if (s.magic >= 2)
    out.push({
      item: "Black King Bar",
      prio: 5,
      reason: `${s.magic} magic / spell threats — BKB buys a clean window`,
    });
  else if (s.lockdown >= 2)
    out.push({
      item: "Black King Bar",
      prio: 4.5,
      reason: `${s.lockdown} disables — BKB to act through their chain`,
    });

  if (s.evasion)
    out.push({
      item: "Monkey King Bar",
      prio: 4,
      reason: "enemy evasion — MKB restores true strike",
    });

  if (s.illuSummon)
    out.push({
      item: BATTLE_FURY_CARRIES.has(hero.id) ? "Battle Fury" : "Mjollnir",
      prio: 3.5,
      reason: "illusions / summons — cleave & chain lightning clear them",
    });

  if (s.tanky >= 2)
    out.push({
      item: "Silver Edge",
      prio: 3.2,
      reason: `${s.tanky} tanky cores — break their passive + burst`,
    });

  if (s.phys >= 3)
    out.push({
      item: "Assault Cuirass",
      prio: 3,
      reason: `${s.phys} physical cores — armor swings the fights`,
    });

  if (s.heal >= 2)
    out.push({
      item: "Eye of Skadi",
      prio: 2.8,
      reason: "heavy heal / lifesteal — Skadi slows & cuts their healing",
    });

  if (s.silence)
    out.push({
      item: "Manta Style",
      prio: 2.5,
      reason: "enemy silences — Manta dispels them off you",
    });

  if (s.invis)
    out.push({
      item: "Detection (Gem / Sentries)",
      prio: 2.3,
      reason: "invisible cores — hold detection; a Gem snowballs",
    });

  const seen = new Map<string, SituationalItem>();
  for (const o of out) {
    const p = seen.get(o.item);
    if (!p || o.prio > p.prio) seen.set(o.item, o);
  }
  return [...seen.values()].sort((a, b) => b.prio - a.prio).slice(0, 4);
}

/** Core build path for a hero plus lineup-tuned situational items. */
export function buildGuide(hero: Hero, enemies: Hero[]): BuildGuide {
  const base = CORE_BUILDS[hero.id] ?? FALLBACK_BUILD;
  return { ...base, situational: situationalItems(hero, enemies) };
}

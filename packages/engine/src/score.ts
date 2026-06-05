import {
  BRACKET_FIT,
  COUNTERS,
  DATA_VERSION,
  type Hero,
  META,
  SYNERGIES,
  TIERW,
} from "@dota-oracle/data";
import { EDGE_TEXT, has, tagEdges } from "./tags";
import type { MatchupTable, Reason, ScoreResult } from "./types";

// Win-rate advantage (fraction) → score weight, capped. 0.05 → 1.0, 0.10 → 2.0.
const MATCHUP_SCALE = 20;
const MATCHUP_CAP = 3;
// Ignore tiny/low-signal edges so reasons stay meaningful.
const MATCHUP_MIN_WEIGHT = 0.3;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Score a candidate hero for the current draft. Pure and deterministic.
 *
 * total = meta-tier weight
 *       + bracketFit·bracketFactor
 *       + matchup advantage vs each enemy (empirical when `matchups` is given,
 *         else bundled hand-tuned hard counters)
 *       + kit-tag edges (± via {@link tagEdges})
 *       + synergy / setup / mana-aura bonuses with each ally
 */
export function scoreHero(
  cand: Hero,
  team: Hero[],
  enemies: Hero[],
  bracketFactor = 0,
  matchups?: MatchupTable,
): ScoreResult {
  let total = 0;
  const reasons: Reason[] = [];
  const push = (w: number, label: string) => reasons.push({ w, label });

  const meta = META[cand.id];
  if (meta) {
    const w = TIERW[meta.tier];
    total += w;
    push(w, `${DATA_VERSION} ${meta.tier}-tier · ${meta.note}`);
  }

  const bf = BRACKET_FIT[cand.id];
  if (bf && bracketFactor > 0) {
    const w = bf.w * bracketFactor;
    total += w;
    push(w, bf.note);
  }

  const counters = COUNTERS[cand.id] ?? [];
  for (const e of enemies) {
    const adv = matchups?.[e.id]?.[cand.id];
    if (adv !== undefined) {
      // Empirical win-rate matchup replaces the hand-tuned hard-counter pair.
      const w = clamp(adv * MATCHUP_SCALE, -MATCHUP_CAP, MATCHUP_CAP);
      if (Math.abs(w) >= MATCHUP_MIN_WEIGHT) {
        const wr = Math.round((0.5 + adv) * 100);
        total += w;
        push(w, adv >= 0 ? `Favored vs ${e.name} (${wr}% WR)` : `Loses to ${e.name} (${wr}% WR)`);
      }
    } else {
      if (counters.includes(e.id)) {
        total += 3;
        push(3, `Hard counter vs ${e.name}`);
      }
      if ((COUNTERS[e.id] ?? []).includes(cand.id)) {
        total -= 2.5;
        push(-2.5, `${e.name} hard-counters you`);
      }
    }
    for (const ed of tagEdges(cand, e)) {
      total += ed.w;
      push(ed.w, EDGE_TEXT[ed.kind](cand, e));
    }
    for (const ed of tagEdges(e, cand)) {
      if (ed.w <= 0) continue;
      const w = -ed.w * 0.9;
      total += w;
      push(w, `⚠ ${EDGE_TEXT[ed.kind](e, cand)}`);
    }
  }

  for (const t of team) {
    const combo =
      (SYNERGIES[cand.id] ?? []).includes(t.id) || (SYNERGIES[t.id] ?? []).includes(cand.id);
    if (combo) {
      total += 2;
      push(2, `Combos with ${t.name}`);
    }
    if ((has(t, "aoe-control") || has(t, "aoe-disable")) && has(cand, "physical-dps")) {
      total += 0.5;
      push(0.5, `${t.name} sets up your fights`);
    }
    if (has(t, "mana-aura") && has(cand, "mana-dependent")) {
      total += 0.6;
      push(0.6, `${t.name} feeds your mana`);
    }
  }

  // De-duplicate reasons by label, keeping the highest-magnitude weight, then sort.
  const seen = new Map<string, Reason>();
  for (const r of reasons) {
    const p = seen.get(r.label);
    if (!p || Math.abs(r.w) > Math.abs(p.w)) seen.set(r.label, r);
  }
  return {
    total,
    meta,
    reasons: [...seen.values()].sort((x, y) => Math.abs(y.w) - Math.abs(x.w)),
  };
}

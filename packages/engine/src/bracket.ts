import { RANKS, type Rank } from "@dota-oracle/data";

/**
 * Factor applied to BRACKET_FIT weights: full in low brackets, half in mid, none up top.
 *  - Herald–Archon  → 1   (full bracket overlay)
 *  - Legend–Ancient → 0.5 (mild adjustment)
 *  - Divine+        → 0   (raw high-MMR meta)
 */
export function bracketFactorFor(rank: Rank): number {
  const i = RANKS.indexOf(rank);
  if (i <= 3) return 1;
  if (i <= 5) return 0.5;
  return 0;
}

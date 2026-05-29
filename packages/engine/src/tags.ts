import type { Hero } from "@dota-oracle/data";
import type { EdgeKind, TagEdge } from "./types";

/** True when a hero carries a given kit tag. */
export const has = (h: Hero, tag: string): boolean => h.tags.includes(tag);

/** Human-readable explanation for each kind of tag-based edge. */
export const EDGE_TEXT: Record<EdgeKind, (a: Hero, d: Hero) => string> = {
  silence: (a, d) => `${a.name}'s silence shuts down ${d.name}`,
  break: (a, d) => `${a.name} breaks ${d.name}'s passive`,
  units: (a, d) => `${a.name} clears ${d.name}'s illusions/summons`,
  "mana-burn": (a, d) => `${a.name} starves ${d.name}'s mana`,
  lockdown: (a, d) => `${a.name} locks down ${d.name}`,
  "gap-close": (a, d) => `${a.name} gap-closes onto ${d.name}`,
  reflect: (a, d) => `${a.name} reflects ${d.name}'s nukes`,
  burst: (a, d) => `${a.name} bursts ${d.name} down`,
  evasion: (a, d) => `${d.name}'s evasion blunts ${a.name}'s hits`,
};

/**
 * Kit-tag interaction edges of attacker `a` against defender `d`.
 * Positive weights favour `a`; the evasion edge is negative (it hurts `a`).
 */
export function tagEdges(a: Hero, d: Hero): TagEdge[] {
  const e: TagEdge[] = [];
  if (has(a, "silence") && has(d, "spell-reliant")) e.push({ w: 1.5, kind: "silence" });
  if (has(a, "break") && has(d, "passive-reliant")) e.push({ w: 1.5, kind: "break" });
  if (has(a, "aoe-control") && (has(d, "illusion") || has(d, "summon")))
    e.push({ w: 1.4, kind: "units" });
  if (has(a, "mana-burn") && has(d, "mana-dependent")) e.push({ w: 1.2, kind: "mana-burn" });
  if (has(a, "lockdown") && has(d, "squishy") && has(d, "immobile"))
    e.push({ w: 1.2, kind: "lockdown" });
  else if (has(a, "mobility") && has(d, "squishy") && has(d, "immobile"))
    e.push({ w: 1.0, kind: "gap-close" });
  if (has(a, "spell-reflect") && has(d, "magic-burst")) e.push({ w: 1.2, kind: "reflect" });
  if (has(a, "magic-burst") && has(d, "squishy") && !has(d, "immobile"))
    e.push({ w: 0.7, kind: "burst" });
  if (has(d, "evasion") && has(a, "physical-dps") && !has(a, "break"))
    e.push({ w: -1.0, kind: "evasion" });
  return e;
}

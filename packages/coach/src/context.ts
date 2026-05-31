import { COUNTERS, HERO_BY_ID, META, type Rank, type Role, SYNERGIES } from "@dota-oracle/data";
import { type MatchupTable, type Recommendation, lineupSignals } from "@dota-oracle/engine";
import type { ContextHero, DraftContext, Urgency } from "./types";

export interface BuildContextInput {
  recs: Recommendation[];
  allies: { id: string; pos: Role | null }[];
  enemies: { id: string; pos: Role | null }[];
  role: Role;
  rank: Rank;
  bracketFactor: number;
  matchups?: MatchupTable;
}

const SEVERITY_RANK: Record<Urgency, number> = { high: 3, med: 2, low: 1 };

function toContextHeroes(picks: { id: string; pos: Role | null }[]): ContextHero[] {
  return picks
    .map((p) => {
      const h = HERO_BY_ID[p.id];
      return h ? { id: h.id, name: h.name, pos: p.pos } : null;
    })
    .filter((h): h is ContextHero => h !== null);
}

/** Build the structured draft context the coach reasons over. Pure. */
export function buildContext(input: BuildContextInput): DraftContext {
  const allies = toContextHeroes(input.allies);
  const enemies = toContextHeroes(input.enemies);
  const enemyHeroes = enemies
    .map((e) => HERO_BY_ID[e.id])
    .filter((h): h is NonNullable<typeof h> => !!h);
  const signals = lineupSignals(enemyHeroes);

  const top = input.recs[0];
  const topPick = top
    ? {
        id: top.hero.id,
        name: top.hero.name,
        tier: top.meta?.tier,
        total: top.total,
        tags: top.hero.tags,
        reasons: top.reasons.slice(0, 3).map((r) => r.label),
      }
    : null;

  const alternatives = input.recs
    .slice(1, 4)
    .map((r) => ({ id: r.hero.id, name: r.hero.name, total: r.total }));

  const onBoard = new Set<string>([...allies.map((a) => a.id), ...enemies.map((e) => e.id)]);

  // Threats: enemies that beat the top pick (empirical matchup first, else hand-tuned counter).
  const threats: DraftContext["threats"] = [];
  if (topPick) {
    for (const e of enemies) {
      const adv = input.matchups?.[e.id]?.[topPick.id];
      let severity: Urgency | null = null;
      if (adv !== undefined) {
        if (adv <= -0.06) severity = "high";
        else if (adv <= -0.03) severity = "med";
      } else if ((COUNTERS[e.id] ?? []).includes(topPick.id)) {
        severity = "med";
      }
      if (severity) threats.push({ id: e.id, name: e.name, severity });
    }
    threats.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  }

  // Bans: meta S/A heroes not on the board that hard-counter the top pick.
  const bans: DraftContext["bans"] = [];
  if (topPick) {
    for (const [heroId, countered] of Object.entries(COUNTERS)) {
      if (bans.length >= 2) break;
      if (onBoard.has(heroId) || !countered.includes(topPick.id)) continue;
      const meta = META[heroId];
      const hero = HERO_BY_ID[heroId];
      if (hero && meta && (meta.tier === "S" || meta.tier === "A")) {
        bans.push({
          id: heroId,
          name: hero.name,
          reason: `${meta.tier}-tier, counters ${topPick.name}`,
        });
      }
    }
  }

  // Allies that combo with the top pick.
  const synergyAllies: DraftContext["synergyAllies"] = [];
  if (topPick) {
    for (const a of allies) {
      const combo =
        (SYNERGIES[topPick.id] ?? []).includes(a.id) ||
        (SYNERGIES[a.id] ?? []).includes(topPick.id);
      if (combo) synergyAllies.push({ id: a.id, name: a.name });
    }
  }

  return {
    role: input.role,
    rank: input.rank,
    bracketFactor: input.bracketFactor,
    topPick,
    alternatives,
    allies,
    enemies,
    signals,
    threats,
    bans,
    synergyAllies,
    contestedRole: allies.some((a) => a.pos === input.role),
    hasMatchupData: !!input.matchups && Object.keys(input.matchups).length > 0,
  };
}

import { HERO_BY_ID, type Hero, TIERW } from "@dota-oracle/data";
import { describe, expect, it } from "vitest";
import { bracketFactorFor } from "./bracket";
import { buildGuide, lineupSignals, situationalItems } from "./items";
import { scoreHero } from "./score";
import { tagEdges } from "./tags";

const hero = (id: string): Hero => {
  const h = HERO_BY_ID[id];
  if (!h) throw new Error(`test fixture missing hero "${id}"`);
  return h;
};

describe("bracketFactorFor", () => {
  it("is full below Archon, half mid, none at Divine+", () => {
    expect(bracketFactorFor("Herald")).toBe(1);
    expect(bracketFactorFor("Archon")).toBe(1);
    expect(bracketFactorFor("Legend")).toBe(0.5);
    expect(bracketFactorFor("Ancient")).toBe(0.5);
    expect(bracketFactorFor("Divine")).toBe(0);
    expect(bracketFactorFor("Immortal")).toBe(0);
  });
});

describe("scoreHero", () => {
  it("applies the meta-tier weight with no board", () => {
    const res = scoreHero(hero("spectre"), [], [], 0);
    expect(res.meta?.tier).toBe("S");
    expect(res.total).toBe(TIERW.S);
    expect(res.reasons.some((r) => r.label.includes("S-tier"))).toBe(true);
  });

  it("adds the bracket-fit overlay scaled by the factor", () => {
    const low = scoreHero(hero("spectre"), [], [], 1);
    const high = scoreHero(hero("spectre"), [], [], 0);
    // Spectre has bracketFit w=1, so the low-bracket score is one point higher.
    expect(low.total - high.total).toBeCloseTo(1, 5);
  });

  it("rewards hard counters against the enemy board", () => {
    const res = scoreHero(hero("anti-mage"), [], [hero("medusa")], 0);
    expect(res.reasons.some((r) => r.label === "Hard counter vs Medusa")).toBe(true);
    expect(res.reasons.some((r) => r.label.includes("starves"))).toBe(true);
  });

  it("rewards synergy with allies", () => {
    const res = scoreHero(hero("faceless-void"), [hero("magnus")], [], 0);
    expect(res.reasons.some((r) => r.label === "Combos with Magnus")).toBe(true);
  });

  it("is deterministic", () => {
    const a = scoreHero(hero("juggernaut"), [hero("magnus")], [hero("medusa")], 0.5);
    const b = scoreHero(hero("juggernaut"), [hero("magnus")], [hero("medusa")], 0.5);
    expect(a).toEqual(b);
  });
});

describe("tagEdges", () => {
  it("flags mana-burn vs mana-dependent targets", () => {
    const edges = tagEdges(hero("anti-mage"), hero("medusa"));
    expect(edges.find((e) => e.kind === "mana-burn")?.w).toBe(1.2);
  });

  it("penalises physical attackers into evasion", () => {
    const edges = tagEdges(hero("sven"), hero("phantom-assassin"));
    expect(edges.find((e) => e.kind === "evasion")?.w).toBe(-1.0);
  });
});

describe("situationalItems", () => {
  it("prioritises BKB against multiple magic threats", () => {
    const items = situationalItems(hero("juggernaut"), [hero("zeus"), hero("lina")]);
    expect(items[0]?.item).toBe("Black King Bar");
  });

  it("counts lineup signals", () => {
    const s = lineupSignals([hero("zeus"), hero("lina")]);
    expect(s.magic).toBe(2);
  });

  it("returns at most four items", () => {
    const items = situationalItems(hero("juggernaut"), [
      hero("zeus"),
      hero("lina"),
      hero("phantom-assassin"),
      hero("riki"),
      hero("wraith-king"),
    ]);
    expect(items.length).toBeLessThanOrEqual(4);
  });
});

describe("buildGuide", () => {
  it("returns the core build for a known carry", () => {
    expect(buildGuide(hero("juggernaut"), []).key).toBe("Manta Style");
  });

  it("falls back for a hero without a dedicated build", () => {
    expect(buildGuide(hero("abaddon"), []).key).toBe("core farming item");
  });
});

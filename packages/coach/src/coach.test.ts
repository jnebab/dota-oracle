import { HERO_BY_ID } from "@dota-oracle/data";
import { type LineupSignals, type Recommendation, scoreHero } from "@dota-oracle/engine";
import { describe, expect, it } from "vitest";
import { buildContext } from "./context";
import { parseCoachBrief } from "./parse";
import { mandatoryModuleIds, selectModulesRules } from "./rules";
import type { CoachModule, DraftContext, ModuleId } from "./types";

const NO_SIGNALS: LineupSignals = {
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

function makeCtx(over: Partial<DraftContext> = {}): DraftContext {
  return {
    role: "Carry",
    rank: "Archon",
    bracketFactor: 1,
    topPick: { id: "spectre", name: "Spectre", total: 5, tags: ["physical-dps"], reasons: [] },
    alternatives: [],
    allies: [],
    enemies: [{ id: "x", name: "X", pos: null }],
    signals: { ...NO_SIGNALS },
    threats: [],
    bans: [],
    synergyAllies: [],
    contestedRole: false,
    hasMatchupData: false,
    ...over,
  };
}

const hero = (id: string) => {
  const h = HERO_BY_ID[id];
  if (!h) throw new Error(`missing fixture hero ${id}`);
  return h;
};
const rec = (id: string): Recommendation => ({ hero: hero(id), ...scoreHero(hero(id), [], [], 0) });

function ctx(enemies: string[], allies: { id: string; pos: string | null }[] = []) {
  return buildContext({
    recs: [rec("spectre"), rec("medusa"), rec("juggernaut")],
    allies: allies.map((a) => ({ id: a.id, pos: a.pos as never })),
    enemies: enemies.map((id) => ({ id, pos: null })),
    role: "Carry",
    rank: "Archon",
    bracketFactor: 1,
  });
}

const ids = (mods: CoachModule[]) => mods.map((m) => m.id);
const byId = (mods: CoachModule[], id: ModuleId) => mods.find((m) => m.id === id);

describe("buildContext", () => {
  it("computes lineup signals from the enemy board", () => {
    const c = ctx(["lina", "tinker", "zeus", "lion"]);
    expect(c.signals.magic).toBeGreaterThanOrEqual(2);
    expect(c.topPick?.name).toBe("Spectre");
    expect(c.alternatives.map((a) => a.name)).toContain("Medusa");
  });

  it("flags a contested role when an ally shares it", () => {
    const c = ctx([], [{ id: "juggernaut", pos: "Carry" }]);
    expect(c.contestedRole).toBe(true);
  });
});

describe("selectModulesRules — adaptivity", () => {
  it("surfaces BKB timing (mandatory, high) vs a magic lineup", () => {
    const brief = selectModulesRules(ctx(["lina", "tinker", "zeus", "lion"]));
    expect(ids(brief.modules)).toContain("bkb-timing");
    expect(byId(brief.modules, "bkb-timing")?.urgency).toBe("high");
    expect(brief.modules[0]?.id).toBe("bkb-timing"); // highest urgency first
  });

  it("morphs to MKB + break-passives vs a physical/tanky lineup", () => {
    const magicModules = ids(selectModulesRules(ctx(["lina", "tinker", "zeus", "lion"])).modules);
    const physModules = ids(
      selectModulesRules(ctx(["phantom-assassin", "bristleback", "wraith-king", "slardar"]))
        .modules,
    );
    // Physical-lineup-specific modules appear...
    expect(physModules).toContain("mkb-evasion"); // PA evasion
    expect(physModules).toContain("break-passives"); // 3 tanky cores
    // ...and they were NOT in the magic-lineup brief — the panel set changed.
    expect(magicModules).not.toContain("mkb-evasion");
    expect(magicModules).not.toContain("break-passives");
  });

  it("always includes a baseline so the panel is never empty", () => {
    const brief = selectModulesRules(ctx([]));
    expect(brief.modules.length).toBeGreaterThan(0);
    expect(ids(brief.modules)).toContain("item-plan");
  });

  it("caps modules at five", () => {
    const brief = selectModulesRules(
      ctx(["lina", "tinker", "phantom-assassin", "bristleback", "riki"]),
    );
    expect(brief.modules.length).toBeLessThanOrEqual(5);
  });
});

describe("parseCoachBrief — validation + safety floor", () => {
  const magic = () => ctx(["lina", "tinker", "zeus", "lion"]);

  it("keeps valid eligible modules and marks source ai", () => {
    const raw = JSON.stringify({
      headline: "Cope with the casters.",
      modules: [{ id: "bkb-timing", urgency: "high", note: "rush bkb" }],
    });
    const brief = parseCoachBrief(raw, magic());
    expect(brief.source).toBe("ai");
    expect(byId(brief.modules, "bkb-timing")?.note).toBe("rush bkb");
  });

  it("drops unknown / ineligible ids", () => {
    const raw = JSON.stringify({
      headline: "x",
      modules: [
        { id: "made-up-module", urgency: "high" }, // unknown → dropped
        { id: "mkb-evasion", urgency: "high" }, // ineligible (no evasion) → dropped
        { id: "bkb-timing", urgency: "med" },
      ],
    });
    const brief = parseCoachBrief(raw, magic());
    expect(ids(brief.modules)).not.toContain("made-up-module");
    expect(ids(brief.modules)).not.toContain("mkb-evasion");
    expect(ids(brief.modules)).toContain("bkb-timing");
  });

  it("force-includes a mandatory module the AI omitted (safety floor)", () => {
    const raw = JSON.stringify({
      headline: "x",
      modules: [{ id: "item-plan", urgency: "low" }], // AI forgot BKB
    });
    const brief = parseCoachBrief(raw, magic());
    expect(ids(brief.modules)).toContain("bkb-timing"); // injected
  });

  it("falls back to rules when the AI returns no usable modules", () => {
    const raw = JSON.stringify({ headline: "x", modules: [] });
    const brief = parseCoachBrief(raw, ctx([])); // no mandatory modules
    expect(brief.source).toBe("rules");
    expect(brief.modules.length).toBeGreaterThan(0);
  });

  it("throws on non-JSON output (caller then falls back)", () => {
    expect(() => parseCoachBrief("the enemy has a lot of magic", magic())).toThrow();
  });

  it("never drops a mandatory module even past the cap (B1)", () => {
    // Six mandatory triggers at once: contested role + magic + evasion + tanky + heal + high threat.
    const ctx = makeCtx({
      contestedRole: true,
      signals: { ...NO_SIGNALS, magic: 3, tanky: 3, evasion: true, heal: 3, lockdown: 3 },
      threats: [{ id: "x", name: "X", severity: "high" }],
    });
    const mandatory = mandatoryModuleIds(ctx);
    expect(mandatory.length).toBeGreaterThan(5);
    const shown = ids(selectModulesRules(ctx).modules);
    for (const id of mandatory) expect(shown).toContain(id);
  });

  it("re-normalizes an AI-demoted mandatory module to high and keeps it (B2)", () => {
    // Enough eligible non-mandatory modules to fill the cap; AI marks bkb low.
    const ctx = makeCtx({
      signals: { ...NO_SIGNALS, magic: 2 },
      threats: [{ id: "x", name: "X", severity: "med" }],
      bans: [{ id: "lion", name: "Lion", reason: "counters you" }],
    });
    const raw = JSON.stringify({
      headline: "x",
      modules: [
        { id: "bkb-timing", urgency: "low" }, // mandatory, AI tried to bury it
        { id: "survive-early", urgency: "high" },
        { id: "comfort-pick", urgency: "high" },
        { id: "item-plan", urgency: "high" },
        { id: "threats", urgency: "high" },
        { id: "ban-warning", urgency: "high" },
      ],
    });
    const brief = parseCoachBrief(raw, ctx);
    expect(ids(brief.modules)).toContain("bkb-timing");
    expect(byId(brief.modules, "bkb-timing")?.urgency).toBe("high");
  });

  it("tolerates code fences / surrounding prose", () => {
    const raw = '```json\n{"headline":"hi","modules":[{"id":"bkb-timing","urgency":"high"}]}\n```';
    const brief = parseCoachBrief(raw, magic());
    expect(brief.source).toBe("ai");
    expect(ids(brief.modules)).toContain("bkb-timing");
  });
});

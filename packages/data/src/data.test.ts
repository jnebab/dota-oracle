import { describe, expect, it } from "vitest";
import { HEROES, HERO_ALIASES, HERO_BY_ID, validateData } from "./index";

describe("data integrity", () => {
  it("passes schema + reference validation", () => {
    expect(() => validateData()).not.toThrow();
  });

  it("has a non-trivial, de-duplicated roster", () => {
    expect(HEROES.length).toBeGreaterThan(100);
    const ids = new Set(HEROES.map((h) => h.id));
    expect(ids.size).toBe(HEROES.length);
  });

  it("indexes every hero by id", () => {
    for (const h of HEROES) expect(HERO_BY_ID[h.id]).toBe(h);
  });

  it("keeps the roster sorted by name", () => {
    const names = HEROES.map((h) => h.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("never claims one alias for two different heroes", () => {
    const owner = new Map<string, string>();
    for (const [id, list] of Object.entries(HERO_ALIASES)) {
      for (const alias of list) {
        const prev = owner.get(alias);
        expect(prev === undefined || prev === id).toBe(true);
        owner.set(alias, id);
      }
    }
  });

  it("covers multi-word heroes with generated + curated aliases", () => {
    // Single-word heroes are matched by name only; multi-word heroes get a
    // first-word and/or initials alias unless every candidate was ambiguous.
    expect(Object.keys(HERO_ALIASES).length).toBeGreaterThanOrEqual(50);
  });
});

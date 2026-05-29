import { describe, expect, it } from "vitest";
import { HEROES, HERO_BY_ID, validateData } from "./index";

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
});

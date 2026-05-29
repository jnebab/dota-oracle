import { describe, expect, it } from "vitest";
import { parseHeroes } from "./parse";

describe("parseHeroes", () => {
  it("parses multi-word names in spoken order", () => {
    expect(parseHeroes("wraith king, lion, crystal maiden")).toEqual([
      "wraith-king",
      "lion",
      "crystal-maiden",
    ]);
  });

  it("resolves common nicknames", () => {
    expect(parseHeroes("PA void AM")).toEqual(["phantom-assassin", "faceless-void", "anti-mage"]);
  });

  it("prefers the longest phrase (faceless void, not void)", () => {
    expect(parseHeroes("faceless void")).toEqual(["faceless-void"]);
  });

  it("handles the longest hero name", () => {
    expect(parseHeroes("keeper of the light")).toEqual(["keeper-of-the-light"]);
  });

  it("de-duplicates repeated heroes", () => {
    expect(parseHeroes("sniper and sniper")).toEqual(["sniper"]);
  });

  it("ignores words that are not heroes", () => {
    expect(parseHeroes("um the enemy has juggernaut i think")).toEqual(["juggernaut"]);
  });

  it("returns nothing for empty input", () => {
    expect(parseHeroes("")).toEqual([]);
  });
});

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
    expect(parseHeroes("PA void QoP")).toEqual([
      "phantom-assassin",
      "faceless-void",
      "queen-of-pain",
    ]);
  });

  it("matches anti-mage by name (no ambiguous 'am' alias)", () => {
    expect(parseHeroes("anti mage")).toEqual(["anti-mage"]);
  });

  it("does not treat the filler word 'am' as a hero", () => {
    expect(parseHeroes("I am thinking we draft sniper")).toEqual(["sniper"]);
    expect(parseHeroes("am I right")).toEqual([]);
  });

  it("prefers the longest phrase (faceless void, not void)", () => {
    expect(parseHeroes("faceless void")).toEqual(["faceless-void"]);
  });

  it("handles the longest hero name", () => {
    expect(parseHeroes("keeper of the light")).toEqual(["keeper-of-the-light"]);
  });

  it("auto-generates unambiguous first-word and initials aliases", () => {
    expect(parseHeroes("ember")).toEqual(["ember-spirit"]);
    expect(parseHeroes("storm")).toEqual(["storm-spirit"]);
    expect(parseHeroes("wraith")).toEqual(["wraith-king"]);
    expect(parseHeroes("ck")).toEqual(["chaos-knight"]);
    expect(parseHeroes("qop")).toEqual(["queen-of-pain"]);
  });

  it("drops ambiguous generated aliases (wrong-hero safety)", () => {
    expect(parseHeroes("shadow")).toEqual([]); // fiend / demon / shaman
    expect(parseHeroes("es")).toEqual([]); // earth spirit + ember spirit
    expect(parseHeroes("am")).toEqual([]); // stopword, not anti-mage
  });

  it("handles speech-to-text homophones and spacing", () => {
    expect(parseHeroes("clockwork")).toEqual(["clockwerk"]);
    expect(parseHeroes("clock")).toEqual(["clockwerk"]);
    expect(parseHeroes("rubik")).toEqual(["rubick"]);
    expect(parseHeroes("life stealer")).toEqual(["lifestealer"]);
    expect(parseHeroes("ls")).toEqual(["lifestealer"]);
    // The real one-word name still works too.
    expect(parseHeroes("lifestealer")).toEqual(["lifestealer"]);
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

  it("tolerates close mispronunciations of single-word names", () => {
    expect(parseHeroes("donbreaker")).toEqual(["dawnbreaker"]);
    expect(parseHeroes("tekis")).toEqual(["techies"]);
    expect(parseHeroes("rubik")).toEqual(["rubick"]);
    expect(parseHeroes("invokr")).toEqual(["invoker"]);
    expect(parseHeroes("spectr")).toEqual(["spectre"]);
    expect(parseHeroes("lifestealr")).toEqual(["lifestealer"]);
  });

  it("fuzzy-matches within a sentence after exact matches", () => {
    expect(parseHeroes("we have juggernaut and donbreaker")).toEqual(["juggernaut", "dawnbreaker"]);
  });

  it("resolves 'warlord' to Troll Warlord, not warlock", () => {
    expect(parseHeroes("warlord")).toEqual(["troll-warlord"]);
    expect(parseHeroes("abandon")).toEqual([]); // leaver term, not Abaddon
  });

  it("does not match ordinary words or chat to heroes (false-positive guard)", () => {
    // Words that previously mis-resolved when short hero names were fuzzy targets.
    const nonHeroes = [
      "the",
      "enemy",
      "team",
      "push",
      "carry",
      "support",
      "roshan",
      "gank",
      "tower",
      "stack",
      "smoke",
      "jungle",
      "creep",
      "tempo",
      "fight",
      "report",
      "reported",
      "please",
      "really",
      "strong",
      "feeding",
      "rotate",
      "defend",
      "missing",
      "aegis",
      "cheese",
      "buyback",
      "comeback",
      "barracks",
      "judge",
      "budge",
      "nudge",
      "fudge",
      "finger",
      "ringer",
      "singer",
      "thinker",
      "tanker",
      "banker",
      "ticket",
      "winner",
      "miracle",
      "beaver",
      "slaver",
      "spider",
      "sliver",
      "cargo",
      "larger",
      "teaches",
      "teacher",
      "magnets",
      "marcia",
      "martha",
      "raiser",
      "blinks",
      "slacks",
      "wiper",
      "undoing",
      "undertow",
      "should",
      "very",
      "good",
      "jungle",
    ];
    for (const word of nonHeroes) {
      expect(parseHeroes(word), `"${word}" should match no hero`).toEqual([]);
    }
  });
});

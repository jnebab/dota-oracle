import { HEROES } from "./heroes";

/**
 * Curated nicknames + speech-to-text homophones/spacings that can't be derived
 * from the hero name (e.g. "nevermore", "naix", "clockwork", "rubik",
 * "life stealer"). These are authoritative and win over generated aliases.
 */
const CURATED: Record<string, string[]> = {
  "anti-mage": ["antimage"],
  "phantom-assassin": ["pa"],
  "wraith-king": ["wk", "skeleton king"],
  "shadow-fiend": ["sf", "nevermore"],
  "queen-of-pain": ["qop"],
  "faceless-void": ["void", "fv"],
  "crystal-maiden": ["cm"],
  "drow-ranger": ["drow"],
  "templar-assassin": ["ta"],
  "phantom-lancer": ["pl"],
  "outworld-destroyer": ["od", "outworld devourer"],
  "nature-s-prophet": ["np", "furion", "natures prophet"],
  "vengeful-spirit": ["vs", "venge"],
  "centaur-warrunner": ["centaur"],
  "spirit-breaker": ["bara"],
  "nyx-assassin": ["nyx"],
  "keeper-of-the-light": ["kotl"],
  "ancient-apparition": ["aa"],
  "legion-commander": ["lc", "legion"],
  "night-stalker": ["ns"],
  "troll-warlord": ["troll", "warlord"],
  "monkey-king": ["mk"],
  "dragon-knight": ["dk"],
  "witch-doctor": ["wd"],
  "skywrath-mage": ["skywrath", "sky"],
  "treant-protector": ["treant"],
  "naga-siren": ["naga"],
  windranger: ["wind ranger"],
  clinkz: ["clinks"],
  clockwerk: ["clock", "clockwork"],
  rubick: ["rubik"],
  lifestealer: ["ls", "life stealer", "naix"],
  broodmother: ["brood", "brood mother"],
  "lone-druid": ["ld"],
  "arc-warden": ["arc"],
  "primal-beast": ["primal"],
  necrophos: ["necro"],
  timbersaw: ["timber", "timber saw"],
  bristleback: ["bristle", "bristle back"],
  io: ["wisp"],
};

// Short function words to never accept as a generated alias (e.g. Anti-Mage's
// "am" initials collide with the spoken word "am").
const STOPWORDS = new Set([
  "am",
  "an",
  "as",
  "at",
  "be",
  "by",
  "do",
  "go",
  "he",
  "hi",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "no",
  "of",
  "oh",
  "ok",
  "on",
  "or",
  "so",
  "to",
  "up",
  "us",
  "we",
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Build the alias map: curated entries plus, for every multi-word hero, its
 * first word and its initials — but only when that token is unambiguous (maps
 * to exactly one hero), isn't a stopword, and isn't already a real hero name
 * or a curated alias. Ambiguous tokens (e.g. "shadow", "es", "ss") are dropped
 * entirely so dictation never resolves to the wrong hero.
 */
function buildAliases(): Record<string, string[]> {
  // Authoritative reservations: real hero names + curated aliases.
  const reserved = new Set<string>();
  for (const h of HEROES) reserved.add(norm(h.name));
  for (const list of Object.values(CURATED)) for (const a of list) reserved.add(norm(a));

  // Generated candidates (first word + initials) per hero, with global counts
  // so we can detect ambiguity.
  const candidates = new Map<string, string[]>();
  const count = new Map<string, number>();
  for (const h of HEROES) {
    const tokens = norm(h.name).split(" ");
    if (tokens.length < 2) continue; // single-word names are matched directly
    const firstWord = tokens[0] ?? "";
    const initials = tokens.map((t) => t.charAt(0)).join("");
    const cands = [firstWord, initials].filter(
      (c) => c.length >= 2 && !STOPWORDS.has(c) && !reserved.has(c),
    );
    candidates.set(h.id, cands);
    for (const c of cands) count.set(c, (count.get(c) ?? 0) + 1);
  }

  const result: Record<string, string[]> = {};
  const add = (id: string, alias: string) => {
    const list = result[id] ?? [];
    list.push(alias);
    result[id] = list;
  };
  // Curated first (authoritative), normalized.
  for (const [id, list] of Object.entries(CURATED)) for (const a of list) add(id, norm(a));
  // Then unambiguous generated aliases.
  for (const h of HEROES) {
    for (const c of candidates.get(h.id) ?? []) {
      if ((count.get(c) ?? 0) === 1) add(h.id, c);
    }
  }
  // De-duplicate each hero's alias list.
  for (const id of Object.keys(result)) {
    result[id] = [...new Set(result[id])];
  }
  return result;
}

/**
 * Spoken nicknames + speech-to-text homophones/spacings + auto-generated
 * first-word and initials aliases → hero id, for board dictation.
 * Keys are hero ids (slugs); validateData() asserts every key is real.
 */
export const HERO_ALIASES: Record<string, string[]> = buildAliases();

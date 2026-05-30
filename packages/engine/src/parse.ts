import { HEROES, HERO_ALIASES } from "@dota-oracle/data";

/** Lowercase, strip punctuation, collapse whitespace → word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Capped Levenshtein edit distance. Returns cap+1 once it provably exceeds cap. */
function levenshtein(a: string, b: string, cap: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > cap) return cap + 1;
  let prev = new Int32Array(bl + 1);
  let cur = new Int32Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    cur[0] = i;
    let rowMin = i;
    const ac = a.charCodeAt(i - 1);
    for (let j = 1; j <= bl; j++) {
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1;
      // Indices are always in range; the ?? 0 only satisfies the type-checker.
      const v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > cap) return cap + 1;
    const tmp = prev;
    prev = cur;
    cur = tmp;
  }
  return prev[bl] ?? 0;
}

/** Soundex phonetic key (catches "sounds-like" mishearings, e.g. tekis≈techies). */
function soundex(s: string): string {
  const u = s.toUpperCase().replace(/[^A-Z]/g, "");
  if (!u) return "";
  const code = (c: string): string => {
    if ("BFPV".includes(c)) return "1";
    if ("CGJKQSXZ".includes(c)) return "2";
    if ("DT".includes(c)) return "3";
    if (c === "L") return "4";
    if ("MN".includes(c)) return "5";
    if (c === "R") return "6";
    return "0"; // vowels, H, W, Y
  };
  const first = u[0] ?? "";
  let out = first;
  let prevCode = code(first);
  for (let i = 1; i < u.length && out.length < 4; i++) {
    const c = u[i] ?? "";
    const d = code(c);
    if (d !== "0" && d !== prevCode) out += d;
    if (c !== "H" && c !== "W") prevCode = d; // H/W are transparent; vowels reset
  }
  return `${out}000`.slice(0, 4);
}

interface FuzzyCand {
  phrase: string;
  id: string;
  sdx: string;
}

interface PhraseIndex {
  byPhrase: Map<string, string>; // normalized phrase → hero id
  maxWords: number;
  fuzzy: FuzzyCand[]; // single-word hero names (len ≥ 5) for approximate matching
}

let INDEX: PhraseIndex | null = null;

function index(): PhraseIndex {
  if (INDEX) return INDEX;
  const byPhrase = new Map<string, string>();
  let maxWords = 1;
  const add = (phrase: string, id: string) => {
    const norm = tokenize(phrase).join(" ");
    if (!norm) return;
    byPhrase.set(norm, id);
    maxWords = Math.max(maxWords, norm.split(" ").length);
  };
  for (const h of HEROES) {
    add(h.name, h.id);
    for (const alias of HERO_ALIASES[h.id] ?? []) add(alias, h.id);
  }
  // Fuzzy targets: single-word hero names of >=7 chars only. Real names (not
  // shorthand aliases) keep matches meaningful; the length floor excludes the
  // short names (tinker, pudge, oracle, sniper, weaver, razor, largo, magnus,
  // viper, slark, marci, medusa…) that are edit-distance-close to many ordinary
  // words and would drive false positives.
  const fuzzy: FuzzyCand[] = [];
  for (const h of HEROES) {
    const name = tokenize(h.name).join(" ");
    if (!name.includes(" ") && name.length >= 7) {
      fuzzy.push({ phrase: name, id: h.id, sdx: soundex(name) });
    }
  }
  INDEX = { byPhrase, maxWords, fuzzy };
  return INDEX;
}

// Ordinary words that slip past the first-letter + distance gates and sound
// like a long hero name. Cheap denylist to keep them from matching.
const FUZZY_STOPWORDS = new Set([
  "teaches",
  "teacher",
  "undoing",
  "undoings",
  "undertow",
  "undertows",
]);

/**
 * Approximate-match a leftover token to a single-word hero name (>=7 chars).
 * Requires a matching first letter, then accepts a near edit-distance match
 * (<=2) or a Soundex "sounds-like" match (distance <=3, similar length). Only
 * an unambiguous single best hero is returned — ties yield null.
 */
function fuzzyMatch(token: string, fuzzy: FuzzyCand[]): string | null {
  if (token.length < 5 || FUZZY_STOPWORDS.has(token)) return null;
  const tsx = soundex(token);
  const head = token[0];
  let bestId: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  let tie = false;
  for (const cand of fuzzy) {
    if (cand.phrase[0] !== head) continue; // must share the first letter
    const d = levenshtein(token, cand.phrase, 3);
    const accept =
      d <= 2 ||
      (tsx !== "" &&
        tsx === cand.sdx &&
        Math.abs(token.length - cand.phrase.length) <= 3 &&
        d <= 3);
    if (!accept) continue;
    if (d < bestDist) {
      bestDist = d;
      bestId = cand.id;
      tie = false;
    } else if (d === bestDist && cand.id !== bestId) {
      tie = true;
    }
  }
  return tie ? null : bestId;
}

/**
 * Extract hero ids from free-form dictated/typed text, in order of mention.
 * Greedy longest-phrase exact match first (so "faceless void" wins over "void"
 * and multi-word names resolve), then an approximate fallback per leftover
 * token to tolerate close mispronunciations (e.g. "donbreaker" → dawnbreaker,
 * "tekis" → techies). Duplicates are dropped. Pure.
 */
export function parseHeroes(text: string): string[] {
  const { byPhrase, maxWords, fuzzy } = index();
  const words = tokenize(text);
  const ids: string[] = [];
  const seen = new Set<string>();
  const take = (id: string) => {
    if (!seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  };

  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (let n = Math.min(maxWords, words.length - i); n >= 1; n--) {
      const id = byPhrase.get(words.slice(i, i + n).join(" "));
      if (id) {
        take(id);
        i += n;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const word = words[i];
      if (word) {
        const fuzzyId = fuzzyMatch(word, fuzzy);
        if (fuzzyId) take(fuzzyId);
      }
      i++;
    }
  }
  return ids;
}

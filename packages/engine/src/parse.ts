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

interface PhraseIndex {
  byPhrase: Map<string, string>; // normalized phrase → hero id
  maxWords: number;
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
  INDEX = { byPhrase, maxWords };
  return INDEX;
}

/**
 * Extract hero ids from free-form dictated/typed text, in order of mention.
 * Greedy longest-phrase match so "faceless void" wins over "void", multi-word
 * names ("keeper of the light") resolve, and duplicates are dropped. Pure.
 */
export function parseHeroes(text: string): string[] {
  const { byPhrase, maxWords } = index();
  const words = tokenize(text);
  const ids: string[] = [];
  const seen = new Set<string>();

  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (let n = Math.min(maxWords, words.length - i); n >= 1; n--) {
      const id = byPhrase.get(words.slice(i, i + n).join(" "));
      if (id) {
        if (!seen.has(id)) {
          ids.push(id);
          seen.add(id);
        }
        i += n;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }
  return ids;
}

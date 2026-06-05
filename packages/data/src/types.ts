// Core data contracts — the single source of truth shared by web + engine.

export type Attr = "str" | "agi" | "int" | "uni";

export type Role = "Carry" | "Mid" | "Offlane" | "Support" | "Hard Support";

export type Tier = "S" | "A" | "B" | "C" | "D";

export interface Hero {
  id: string;
  name: string;
  attr: Attr;
  roles: Role[];
  tags: string[];
}

/** 7.41d meta read for a hero, keyed by hero id in {@link META}. */
export interface MetaTier {
  tier: Tier;
  note: string;
}

/** Low-bracket friendliness weight for a hero, keyed by hero id in {@link BRACKET_FIT}. */
export interface BracketFit {
  w: number;
  note: string;
}

/** Item build path for a hero, keyed by hero id in {@link CORE_BUILDS}. */
export interface Build {
  key: string;
  path: string[];
  note: string;
}

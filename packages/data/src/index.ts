// @dota-oracle/data — single source of truth for hero/meta/build data + zod schemas.

export * from "./types";
export * from "./schemas";
export * from "./heroes";
export * from "./counters";
export * from "./synergies";
export * from "./meta";
export * from "./bracket";
export * from "./builds";
export * from "./aliases";
export * from "./icons";

import { HERO_ALIASES } from "./aliases";
import { BRACKET_FIT } from "./bracket";
import { CORE_BUILDS } from "./builds";
import { COUNTERS } from "./counters";
import { HEROES } from "./heroes";
import { META } from "./meta";
import {
  aliasesSchema,
  bracketFitMapSchema,
  buildsSchema,
  countersSchema,
  heroesSchema,
  metaSchema,
  synergiesSchema,
} from "./schemas";
import { SYNERGIES } from "./synergies";

export const DATA_VERSION = "7.41c";

/**
 * Validate every bundled dataset against its zod schema, and assert that all
 * id references (counters/synergies/meta/bracket/build keys) point at real heroes.
 * Throws on the first problem. Intended for tests and dev-time sanity checks.
 */
export function validateData(): void {
  heroesSchema.parse(HEROES);
  countersSchema.parse(COUNTERS);
  synergiesSchema.parse(SYNERGIES);
  metaSchema.parse(META);
  bracketFitMapSchema.parse(BRACKET_FIT);
  buildsSchema.parse(CORE_BUILDS);
  aliasesSchema.parse(HERO_ALIASES);

  const ids = new Set(HEROES.map((h) => h.id));
  const assertId = (id: string, where: string) => {
    if (!ids.has(id)) throw new Error(`Unknown hero id "${id}" referenced in ${where}`);
  };

  for (const [id, list] of Object.entries(COUNTERS)) {
    assertId(id, "COUNTERS key");
    for (const target of list) assertId(target, `COUNTERS["${id}"]`);
  }
  for (const [id, list] of Object.entries(SYNERGIES)) {
    assertId(id, "SYNERGIES key");
    for (const target of list) assertId(target, `SYNERGIES["${id}"]`);
  }
  for (const id of Object.keys(META)) assertId(id, "META key");
  for (const id of Object.keys(BRACKET_FIT)) assertId(id, "BRACKET_FIT key");
  for (const id of Object.keys(CORE_BUILDS)) assertId(id, "CORE_BUILDS key");
  for (const id of Object.keys(HERO_ALIASES)) assertId(id, "HERO_ALIASES key");
}

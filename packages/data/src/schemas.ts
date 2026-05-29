import { z } from "zod";

export const attrSchema = z.enum(["str", "agi", "int", "uni"]);

export const roleSchema = z.enum(["Carry", "Mid", "Offlane", "Support", "Hard Support"]);

export const tierSchema = z.enum(["S", "A", "B", "C", "D"]);

export const heroSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  attr: attrSchema,
  roles: z.array(roleSchema).min(1),
  tags: z.array(z.string()),
});

export const metaTierSchema = z.object({
  tier: tierSchema,
  note: z.string(),
});

export const bracketFitSchema = z.object({
  w: z.number(),
  note: z.string(),
});

export const buildSchema = z.object({
  key: z.string(),
  path: z.array(z.string()).min(1),
  note: z.string(),
});

/** Record keyed by hero id. */
const byHeroId = <T extends z.ZodTypeAny>(value: T) => z.record(z.string(), value);

export const heroesSchema = z.array(heroSchema);
export const countersSchema = byHeroId(z.array(z.string()));
export const synergiesSchema = byHeroId(z.array(z.string()));
export const metaSchema = byHeroId(metaTierSchema);
export const bracketFitMapSchema = byHeroId(bracketFitSchema);
export const buildsSchema = byHeroId(buildSchema);

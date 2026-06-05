import { RANKS, ROLES, type Rank, type Role } from "@dota-oracle/data";
import { z } from "zod";

const KEY = "draft-oracle:prefs:v1";

const roleEnum = z.enum(ROLES as [Role, ...Role[]]);
const rankEnum = z.enum(RANKS as unknown as [Rank, ...Rank[]]);

const prefsSchema = z.object({
  pools: z.record(roleEnum, z.array(z.string())).optional(),
  role: roleEnum.optional(),
  rank: rankEnum.optional(),
  showCount: z.number().optional(),
});

export type Prefs = z.infer<typeof prefsSchema>;

/** Load persisted preferences, tolerating missing/old/corrupt data. */
export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return prefsSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable / quota — non-fatal
  }
}

/** A complete per-role pool map (every role present, empty by default). */
export function emptyPools(): Record<Role, string[]> {
  return ROLES.reduce(
    (acc, role) => {
      acc[role] = [];
      return acc;
    },
    {} as Record<Role, string[]>,
  );
}

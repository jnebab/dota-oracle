import { z } from "zod";

// Same-origin "/api" on Vercel by default; override for split local dev.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const metaTierSchema = z.object({
  hero_id: z.string(),
  tier: z.enum(["S", "A", "B", "C", "D"]),
  note: z.string(),
});

export const metaResponseSchema = z.object({
  patch: z.string(),
  bracket: z.string().nullable(),
  source: z.string(),
  tiers: z.array(metaTierSchema),
});
export type MetaResponse = z.infer<typeof metaResponseSchema>;

const playerHeroSchema = z.object({
  hero_id: z.number(),
  games: z.number(),
  wins: z.number(),
  win_rate: z.number(),
});

export const playerResponseSchema = z.object({
  account_id: z.number(),
  match_count: z.number(),
  win_rate: z.number(),
  top_heroes: z.array(playerHeroSchema),
});
export type PlayerResponse = z.infer<typeof playerResponseSchema>;

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    // Surface the API's `detail` message when present.
    let detail: string | undefined;
    try {
      detail = (await res.json())?.detail;
    } catch {
      // non-JSON error body; fall through to the status code
    }
    throw new Error(detail ?? `Request failed (${res.status})`);
  }
  return schema.parse(await res.json());
}

export function getMeta(params?: { patch?: string; bracket?: string }): Promise<MetaResponse> {
  const qs = new URLSearchParams();
  if (params?.patch) qs.set("patch", params.patch);
  if (params?.bracket) qs.set("bracket", params.bracket);
  const query = qs.toString();
  return getJson(`/api/meta${query ? `?${query}` : ""}`, metaResponseSchema);
}

export function getPlayer(handle: string): Promise<PlayerResponse> {
  return getJson(`/api/player/${encodeURIComponent(handle)}`, playerResponseSchema);
}

const matchPlayerSchema = z.object({
  hero_id: z.number(),
  hero: z.string().nullable(),
  is_radiant: z.boolean(),
  position: z.string().nullable(),
});

export const matchImportResponseSchema = z.object({
  match_id: z.number().nullable(),
  duration_seconds: z.number(),
  searched_account_id: z.number(),
  searched_is_radiant: z.boolean().nullable(),
  radiant: z.array(z.string()),
  dire: z.array(z.string()),
  players: z.array(matchPlayerSchema),
});
export type MatchImportResponse = z.infer<typeof matchImportResponseSchema>;

export function getRecentMatch(handle: string): Promise<MatchImportResponse> {
  return getJson(`/api/recent/${encodeURIComponent(handle)}`, matchImportResponseSchema);
}

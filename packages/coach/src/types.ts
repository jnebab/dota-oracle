import type { Rank, Role, Tier } from "@dota-oracle/data";
import type { LineupSignals } from "@dota-oracle/engine";

export type Urgency = "high" | "med" | "low";

/** The closed catalog of coaching modules. AI output is restricted to these ids. */
export type ModuleId =
  | "bkb-timing"
  | "survive-early"
  | "break-passives"
  | "mkb-evasion"
  | "anti-heal"
  | "dispel-silence"
  | "cleave-illusions"
  | "lane-matchup"
  | "ban-warning"
  | "synergy-highlight"
  | "role-contested"
  | "comfort-pick"
  | "threats"
  | "item-plan";

export interface ContextHero {
  id: string;
  name: string;
  pos: Role | null;
}

export interface DraftContext {
  role: Role;
  rank: Rank;
  bracketFactor: number;
  topPick: {
    id: string;
    name: string;
    tier?: Tier;
    total: number;
    tags: string[];
    reasons: string[];
  } | null;
  alternatives: { id: string; name: string; total: number }[];
  allies: ContextHero[];
  enemies: ContextHero[];
  signals: LineupSignals;
  threats: { id: string; name: string; severity: Urgency }[];
  bans: { id: string; name: string; reason: string }[];
  synergyAllies: { id: string; name: string }[];
  contestedRole: boolean;
  hasMatchupData: boolean;
}

export interface CoachModule {
  id: ModuleId;
  urgency: Urgency;
  note?: string;
}

export type CoachSource = "ai" | "rules";

/** Detected on-device AI capability of the current browser/device. */
export type CoachCapability = "ai" | "ai-downloadable" | "rules";

export interface CoachBrief {
  headline: string;
  modules: CoachModule[];
  source: CoachSource;
}

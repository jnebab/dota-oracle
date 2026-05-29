import type { Build, Hero, MetaTier } from "@dota-oracle/data";

export interface Reason {
  w: number;
  label: string;
}

export interface ScoreResult {
  total: number;
  meta: MetaTier | undefined;
  reasons: Reason[];
}

export interface Recommendation extends ScoreResult {
  hero: Hero;
}

export type EdgeKind =
  | "silence"
  | "break"
  | "units"
  | "mana-burn"
  | "lockdown"
  | "gap-close"
  | "reflect"
  | "burst"
  | "evasion";

export interface TagEdge {
  w: number;
  kind: EdgeKind;
}

export interface SituationalItem {
  item: string;
  prio: number;
  reason: string;
}

export interface LineupSignals {
  magic: number;
  phys: number;
  tanky: number;
  lockdown: number;
  evasion: boolean;
  illuSummon: boolean;
  silence: boolean;
  invis: boolean;
  heal: number;
}

export interface BuildGuide extends Build {
  situational: SituationalItem[];
}

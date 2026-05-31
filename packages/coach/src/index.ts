// @dota-oracle/coach — pure: turns the engine's draft state into an adaptive,
// catalog-bounded set of coaching modules (rules-tier baseline + AI-output
// validator with a safety floor). No React, no IO.

export * from "./types";
export * from "./catalog";
export * from "./context";
export * from "./rules";
export * from "./parse";
export * from "./prompt";

export const COACH_VERSION = "0.1.0";

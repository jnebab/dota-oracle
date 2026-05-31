import {
  COACH_RESPONSE_SCHEMA,
  COACH_SYSTEM_PROMPT,
  type CoachBrief,
  type CoachCapability,
  type DraftContext,
  buildUserPrompt,
  parseCoachBrief,
  selectModulesRules,
} from "@dota-oracle/coach";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Minimal typings for the Chrome built-in Prompt API (not in lib.dom) ---
interface LMSession {
  prompt(
    input: string,
    opts?: { responseConstraint?: unknown; signal?: AbortSignal },
  ): Promise<string>;
  destroy?(): void;
}
interface LMCreateOptions {
  initialPrompts?: { role: string; content: string }[];
  temperature?: number;
  topK?: number;
  monitor?: (m: EventTarget) => void;
}
interface LanguageModelStatic {
  availability(): Promise<string>;
  create(opts?: LMCreateOptions): Promise<LMSession>;
}

function getLM(): LanguageModelStatic | null {
  const g = globalThis as unknown as {
    LanguageModel?: LanguageModelStatic;
    ai?: { languageModel?: LanguageModelStatic };
  };
  const lm = g.LanguageModel ?? g.ai?.languageModel ?? null;
  return lm && typeof lm.availability === "function" ? lm : null;
}

async function detectCapability(): Promise<CoachCapability> {
  const lm = getLM();
  if (!lm) return "rules";
  try {
    const a = await lm.availability();
    if (a === "available") return "ai";
    if (a === "downloadable" || a === "downloading") return "ai-downloadable";
    return "rules";
  } catch {
    return "rules";
  }
}

function hashContext(c: DraftContext): string {
  return JSON.stringify({
    p: c.topPick?.id ?? null,
    e: c.enemies.map((x) => `${x.id}:${x.pos ?? ""}`),
    a: c.allies.map((x) => `${x.id}:${x.pos ?? ""}`),
    r: c.role,
    k: c.rank,
    // include threats so the AI brief refreshes when async matchup data lands
    t: c.threats.map((x) => `${x.id}:${x.severity}`),
  });
}

async function runAI(ctx: DraftContext, session: LMSession): Promise<CoachBrief> {
  const userPrompt = buildUserPrompt(ctx);
  let raw: string;
  try {
    raw = await session.prompt(userPrompt, { responseConstraint: COACH_RESPONSE_SCHEMA });
  } catch {
    // Older runtimes may not support responseConstraint — retry unconstrained.
    raw = await session.prompt(userPrompt);
  }
  return parseCoachBrief(raw, ctx); // throws on invalid → caller falls back to rules
}

interface UseCoachResult {
  brief: CoachBrief;
  capability: CoachCapability;
  enableAI: () => void;
}

/**
 * Returns the coach brief, preferring the on-device AI tier when available and
 * falling back to the deterministic rules brief otherwise (and on any AI error).
 */
export function useCoach(ctx: DraftContext): UseCoachResult {
  const hash = hashContext(ctx);
  // `ctx` is memoized by the caller, so its identity is stable per content.
  const rules = useMemo(() => selectModulesRules(ctx), [ctx]);

  const [capability, setCapability] = useState<CoachCapability>("rules");
  const sessionRef = useRef<LMSession | null>(null);

  useEffect(() => {
    let alive = true;
    detectCapability().then((c) => alive && setCapability(c));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => sessionRef.current?.destroy?.();
  }, []);

  const ensureSession = useCallback(async (): Promise<LMSession> => {
    if (sessionRef.current) return sessionRef.current;
    const lm = getLM();
    if (!lm) throw new Error("Prompt API unavailable");
    const session = await lm.create({
      initialPrompts: [{ role: "system", content: COACH_SYSTEM_PROMPT }],
      temperature: 0.3,
      topK: 3,
    });
    sessionRef.current = session;
    return session;
  }, []);

  const { data } = useQuery({
    queryKey: ["coach", hash],
    queryFn: async () => runAI(ctx, await ensureSession()),
    enabled: capability === "ai",
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 10,
  });

  // One-tap download for the "downloadable" state.
  const enableAI = useCallback(() => {
    const lm = getLM();
    if (!lm) return;
    lm.create({
      initialPrompts: [{ role: "system", content: COACH_SYSTEM_PROMPT }],
      temperature: 0.3,
      topK: 3,
    })
      .then((s) => {
        sessionRef.current = s;
        return detectCapability();
      })
      .then(setCapability)
      .catch(() => setCapability("rules"));
  }, []);

  return { brief: data ?? rules, capability, enableAI };
}

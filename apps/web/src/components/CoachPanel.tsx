import { type CoachBrief, MODULES, type Urgency } from "@dota-oracle/coach";
import { Brain } from "lucide-react";

const URGENCY: Record<Urgency, { label: string; color: string; bg: string; border: string }> = {
  high: {
    label: "high",
    color: "#f0a6b4",
    bg: "rgba(232,114,138,.16)",
    border: "rgba(232,114,138,.4)",
  },
  med: {
    label: "med",
    color: "#e7c684",
    bg: "rgba(232,181,78,.14)",
    border: "rgba(232,181,78,.34)",
  },
  low: {
    label: "low",
    color: "#aab2bd",
    bg: "rgba(125,133,147,.14)",
    border: "rgba(125,133,147,.3)",
  },
};

export function CoachPanel({ brief }: { brief: CoachBrief }) {
  const ai = brief.source === "ai";
  return (
    <section
      className="mb-3 rounded-xl p-3.5"
      style={{
        background: ai
          ? "linear-gradient(180deg,rgba(143,156,242,.08),rgba(15,18,23,.7))"
          : "linear-gradient(180deg,rgba(199,154,69,.06),rgba(15,18,23,.7))",
        border: `1px solid ${ai ? "rgba(143,156,242,.28)" : "rgba(199,154,69,.22)"}`,
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span
          className="oracle-display fs11 flex items-center gap-1.5 uppercase tracking-widest"
          style={{ color: "#f0e6cf" }}
        >
          <Brain size={13} color={ai ? "#8f9cf2" : "#c79a45"} /> Oracle Coach
        </span>
        <span
          className="oracle-mono fs10 rounded-full px-2 py-1"
          style={
            ai
              ? {
                  background: "rgba(143,156,242,.16)",
                  border: "1px solid rgba(143,156,242,.4)",
                  color: "#bcc6f7",
                }
              : {
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#7d8593",
                }
          }
        >
          {ai ? "⚡ on-device AI" : "rule-based"}
        </span>
      </div>

      <p className="fs11 mb-2.5 italic" style={{ color: "#cdd6e1" }}>
        {brief.headline}
      </p>

      <div className="flex flex-col gap-1.5">
        {brief.modules.map((m) => {
          const spec = MODULES[m.id];
          const u = URGENCY[m.urgency];
          return (
            <div
              key={m.id}
              className="flex items-start gap-2.5 rounded-lg px-2.5 py-2"
              style={{
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.07)",
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-md"
                style={{ width: 24, height: 24, fontSize: 13, background: "rgba(255,255,255,.05)" }}
                aria-hidden="true"
              >
                {spec.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="fs11 font-semibold" style={{ color: "#eef1f6" }}>
                    {spec.title}
                  </span>
                  <span
                    className="oracle-mono rounded"
                    style={{
                      fontSize: 8,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      padding: "1px 5px",
                      color: u.color,
                      background: u.bg,
                      border: `1px solid ${u.border}`,
                    }}
                  >
                    {u.label}
                  </span>
                </div>
                {m.note && (
                  <div className="fs11 mt-0.5" style={{ color: "#9aa1ad" }}>
                    {m.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

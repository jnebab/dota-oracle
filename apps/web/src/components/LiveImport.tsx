import { useMutation } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { useState } from "react";
import { type LiveMatchResponse, getLive } from "../lib/api";

interface LiveImportProps {
  onImport: (match: LiveMatchResponse) => void;
}

const fmtTime = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const a = Math.abs(s);
  return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
};

export function LiveImport({ onImport }: LiveImportProps) {
  const [handle, setHandle] = useState("");
  const mutation = useMutation({
    mutationFn: (h: string) => getLive(h),
    onSuccess: onImport,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = handle.trim();
    if (h) mutation.mutate(h);
  };

  return (
    <section
      className="mb-4 rounded-xl p-3.5"
      style={{ background: "rgba(15,18,23,.65)", border: "1px solid rgba(255,255,255,.07)" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Radio size={14} color="#8f9cf2" />
        <span
          className="oracle-display fs11 uppercase tracking-widest"
          style={{ color: "#6b7280" }}
        >
          Live import — autofill the board from a live game
        </span>
      </div>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Steam name or SteamID…"
          className="oracle-root fs11 min-w-0 flex-1 rounded-md px-2.5 py-1.5 outline-none"
          style={{
            background: "rgba(0,0,0,.35)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "#dfe3ea",
          }}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !handle.trim()}
          className="oracle-display fs11 rounded-md px-3 py-1.5 tracking-wide disabled:opacity-50"
          style={{ color: "#0b0d10", background: "#8f9cf2" }}
        >
          {mutation.isPending ? "Pulling…" : "Pull live game"}
        </button>
      </form>
      {mutation.isError && (
        <p className="fs11 mt-2 italic" style={{ color: "#e09a92" }}>
          {mutation.error.message}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="fs11 mt-2" style={{ color: "#a9b0f2" }}>
          Imported live game · {fmtTime(mutation.data.game_time)} on the clock — board filled below.
        </p>
      )}
      <p className="fs10 mt-2 italic" style={{ color: "#566070" }}>
        Pulls the player's current match from STRATZ and drops both lineups onto the board. Requires
        the backend + STRATZ token; if the player isn't in a live game you'll get a friendly notice.
      </p>
    </section>
  );
}

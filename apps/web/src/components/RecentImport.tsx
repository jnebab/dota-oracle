import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { type MatchImportResponse, getRecentMatch } from "../lib/api";

interface RecentImportProps {
  onImport: (match: MatchImportResponse) => void;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function RecentImport({ onImport }: RecentImportProps) {
  const [handle, setHandle] = useState("");
  const mutation = useMutation({
    mutationFn: (h: string) => getRecentMatch(h),
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
        <Download size={14} color="#8f9cf2" />
        <span
          className="oracle-display fs11 uppercase tracking-widest"
          style={{ color: "#6b7280" }}
        >
          Import last match — autofill the board from a recent game
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
          {mutation.isPending ? "Importing…" : "Import last match"}
        </button>
      </form>
      {mutation.isError && (
        <p className="fs11 mt-2 italic" style={{ color: "#e09a92" }}>
          {mutation.error.message}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="fs11 mt-2" style={{ color: "#a9b0f2" }}>
          Imported match {mutation.data.match_id ?? ""} · {fmtTime(mutation.data.duration_seconds)}{" "}
          long — both lineups dropped on the board below.
        </p>
      )}
      <p className="fs10 mt-2 italic" style={{ color: "#566070" }}>
        Pulls the player's most recent finished match from STRATZ and fills both lineups (with
        roles). STRATZ has no live-game feed for normal pubs, so we use the last match. Requires the
        backend + STRATZ token.
      </p>
    </section>
  );
}

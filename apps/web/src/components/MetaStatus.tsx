import { DATA_VERSION } from "@dota-oracle/data";
import { useQuery } from "@tanstack/react-query";
import { getMeta } from "../lib/api";

/**
 * Header chip showing where the meta read comes from. The engine always scores
 * with the bundled snapshot (instant + offline); this just surfaces whether the
 * API's snapshot is reachable, proving the data seam end-to-end.
 */
export function MetaStatus() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["meta"],
    queryFn: () => getMeta(),
    retry: false,
    staleTime: 1000 * 60 * 60,
  });

  const live = !!data && !isError;
  const patch = data?.patch ?? DATA_VERSION;
  const detail = isLoading ? "checking…" : live ? `${data.source} · API` : "bundled";
  const dot = isLoading ? "#7d8593" : live ? "#74b13f" : "#8a7a55";

  return (
    <span
      className="oracle-mono fs10 inline-flex items-center gap-1.5 rounded-full px-2 py-1"
      style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.08)" }}
      title={live ? "Meta snapshot served by the API" : "Using the bundled seed snapshot"}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: dot }}
      />
      meta {patch} · {detail}
    </span>
  );
}

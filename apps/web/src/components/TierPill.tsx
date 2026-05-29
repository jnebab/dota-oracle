import type { Tier } from "@dota-oracle/data";
import { TIER_COLOR } from "../lib/colors";

interface TierPillProps {
  tier: Tier | undefined;
  small?: boolean;
}

export function TierPill({ tier, small }: TierPillProps) {
  if (!tier) return null;
  return (
    <span
      className="oracle-mono rounded font-bold"
      style={{
        fontSize: small ? 9 : 11,
        padding: small ? "1px 4px" : "2px 6px",
        color: "#0b0d10",
        background: TIER_COLOR[tier],
      }}
    >
      {tier}
    </span>
  );
}

import type { Hero } from "@dota-oracle/data";
import { ATTR_COLOR } from "../lib/colors";

interface PortraitProps {
  hero: Hero;
  size?: number;
}

export function Portrait({ hero, size = 38 }: PortraitProps) {
  const initials = hero.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="oracle-mono flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: "#0b0d10",
        background: `radial-gradient(circle at 30% 25%, ${ATTR_COLOR[hero.attr]}, ${ATTR_COLOR[hero.attr]}aa)`,
        boxShadow: `0 0 0 2px ${ATTR_COLOR[hero.attr]}55, inset 0 1px 2px rgba(255,255,255,.35)`,
      }}
    >
      {initials}
    </div>
  );
}

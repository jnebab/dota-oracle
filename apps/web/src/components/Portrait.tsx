import { type Hero, heroIconUrl } from "@dota-oracle/data";
import { useState } from "react";
import { ATTR_COLOR } from "../lib/colors";

interface PortraitProps {
  hero: Hero;
  size?: number;
}

export function Portrait({ hero, size = 38 }: PortraitProps) {
  const [failed, setFailed] = useState(false);
  const url = heroIconUrl(hero.id);
  const ring = `0 0 0 2px ${ATTR_COLOR[hero.attr]}55`;

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={hero.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
        style={{
          width: size,
          height: size,
          boxShadow: ring,
          background: `${ATTR_COLOR[hero.attr]}22`,
        }}
      />
    );
  }

  // Fallback: attribute-colored initials (offline, or if the CDN image fails).
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
        boxShadow: `${ring}, inset 0 1px 2px rgba(255,255,255,.35)`,
      }}
    >
      {initials}
    </div>
  );
}

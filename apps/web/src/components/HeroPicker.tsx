import { HEROES, META } from "@dota-oracle/data";
import { Search } from "lucide-react";
import { useState } from "react";
import { Portrait } from "./Portrait";
import { TierPill } from "./TierPill";

interface HeroPickerProps {
  onPick: (id: string) => void;
  excludeIds: Set<string>;
  placeholder: string;
  accent: string;
}

export function HeroPicker({ onPick, excludeIds, placeholder, accent }: HeroPickerProps) {
  const [q, setQ] = useState("");
  const list = HEROES.filter(
    (h) => !excludeIds.has(h.id) && h.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div
      className="mt-2 rounded-lg p-2.5"
      style={{ background: "rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.06)" }}
    >
      <div
        className="mb-2 flex items-center gap-2 rounded-md px-2.5 py-1.5"
        style={{ background: "rgba(0,0,0,.35)" }}
      >
        <Search size={13} color="#6b7280" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="oracle-root fs11 w-full bg-transparent outline-none"
          style={{ color: "#dfe3ea" }}
        />
        <span className="oracle-mono fs10 shrink-0" style={{ color: "#5d6470" }}>
          {list.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
        {list.map((h) => (
          <button
            type="button"
            key={h.id}
            onClick={() => onPick(h.id)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:brightness-125"
            style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${accent}22` }}
          >
            <Portrait hero={h} size={24} />
            <div className="min-w-0 flex-1">
              <div className="fs11 flex items-center gap-1 truncate" style={{ color: "#dfe3ea" }}>
                {h.name} {META[h.id] && <TierPill tier={META[h.id]?.tier} small />}
              </div>
              <div className="oracle-mono fs10 truncate" style={{ color: "#5d6470" }}>
                {h.roles.join(" · ")}
              </div>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <p className="fs11 col-span-2 py-3 text-center italic" style={{ color: "#566070" }}>
            no heroes match
          </p>
        )}
      </div>
    </div>
  );
}

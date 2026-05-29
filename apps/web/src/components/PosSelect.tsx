import { POS_NUM, ROLES, type Role } from "@dota-oracle/data";

interface PosSelectProps {
  value: Role | null;
  onChange: (pos: Role | null) => void;
  accent: string;
}

export function PosSelect({ value, onChange, accent }: PosSelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value as Role) || null)}
      className="oracle-mono fs10 rounded outline-none"
      style={{
        color: value ? "#0b0d10" : accent,
        background: value ? accent : "rgba(0,0,0,.3)",
        border: `1px solid ${accent}66`,
        padding: "2px 3px",
      }}
    >
      <option value="" style={{ color: "#000" }}>
        pos?
      </option>
      {ROLES.map((r) => (
        <option key={r} value={r} style={{ color: "#000" }}>
          {POS_NUM[r]} {r}
        </option>
      ))}
    </select>
  );
}

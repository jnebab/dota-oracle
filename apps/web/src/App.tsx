import { Swords } from "lucide-react";

export function App() {
  return (
    <div
      className="min-h-screen w-full px-6 py-16 text-[#dfe3ea]"
      style={{
        background:
          "radial-gradient(ellipse 60% 80% at 0% 0%, rgba(116,177,63,.10), transparent 55%),radial-gradient(ellipse 60% 80% at 100% 100%, rgba(209,70,58,.12), transparent 55%),#0a0c0f",
      }}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div
          className="mb-6 flex items-center justify-center rounded-2xl"
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg,#c79a45,#8a6a26)",
            boxShadow: "0 4px 24px rgba(199,154,69,.35)",
          }}
        >
          <Swords size={34} color="#0b0d10" />
        </div>
        <h1 className="text-4xl font-semibold tracking-wide" style={{ color: "#f0e6cf" }}>
          DRAFT ORACLE
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: "#7d8593" }}>
          A Dota 2 draft &amp; live-match advisor. Ranks the best carry from your pool by 7.41c
          meta, matchups, and rank bracket — with lineup-tuned item builds.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.2em]" style={{ color: "#566070" }}>
          Scaffold deployed · building the advisor
        </p>
      </div>
    </div>
  );
}

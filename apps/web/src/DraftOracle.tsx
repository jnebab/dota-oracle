import { buildContext, selectModulesRules } from "@dota-oracle/coach";
import {
  HERO_BY_ID,
  META,
  POS_NUM,
  RANKS,
  ROLES,
  type Rank,
  type Role,
  dotabuffSlug,
} from "@dota-oracle/data";
import { type Recommendation, bracketFactorFor, buildGuide, scoreHero } from "@dota-oracle/engine";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Coins,
  Crosshair,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Swords,
  X,
} from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { CoachPanel } from "./components/CoachPanel";
import { HeroPicker } from "./components/HeroPicker";
import { MetaStatus } from "./components/MetaStatus";
import { MicDictate } from "./components/MicDictate";
import { Portrait } from "./components/Portrait";
import { PosSelect } from "./components/PosSelect";
import { RecentImport } from "./components/RecentImport";
import { TierPill } from "./components/TierPill";
import { type MatchImportResponse, getMatchups } from "./lib/api";

interface BoardPick {
  id: string;
  pos: Role | null;
}

type Side = "ally" | "enemy";

function Card({ children }: { children: ReactNode }) {
  return (
    <section
      className="mb-4 rounded-xl p-3.5"
      style={{ background: "rgba(15,18,23,.65)", border: "1px solid rgba(255,255,255,.07)" }}
    >
      {children}
    </section>
  );
}

const DEFAULT_POOL = [
  "juggernaut",
  "wraith-king",
  "spectre",
  "kez",
  "necrophos",
  "faceless-void",
  "drow-ranger",
  "phantom-assassin",
  "sniper",
  "lifestealer",
  "luna",
  "medusa",
  "slark",
  "sven",
];

export function DraftOracle() {
  const [poolIds, setPoolIds] = useState<string[]>(DEFAULT_POOL);
  const [myRole, setMyRole] = useState<Role>("Carry");
  const [rank, setRank] = useState<Rank>("Archon");
  const [team, setTeam] = useState<BoardPick[]>([]);
  const [enemy, setEnemy] = useState<BoardPick[]>([]);
  const [boardTarget, setBoardTarget] = useState<Side>("ally");
  const [showPool, setShowPool] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const boardUsed = new Set<string>([...team.map((x) => x.id), ...enemy.map((x) => x.id)]);
  const enemyHeroes = enemy
    .map((x) => HERO_BY_ID[x.id])
    .filter((h): h is NonNullable<typeof h> => !!h);

  const addPool = (id: string) => {
    if (!poolIds.includes(id)) setPoolIds([...poolIds, id]);
  };
  const removePool = (id: string) => setPoolIds(poolIds.filter((x) => x !== id));
  const addBoard = (id: string) => {
    if (boardTarget === "ally") {
      if (team.length < 5) setTeam([...team, { id, pos: null }]);
    } else if (enemy.length < 5) {
      setEnemy([...enemy, { id, pos: null }]);
    }
  };
  const updateSide = (side: Side, fn: (arr: BoardPick[]) => BoardPick[]) =>
    (side === "ally" ? setTeam : setEnemy)(fn(side === "ally" ? team : enemy));
  const setPos = (side: Side, id: string, pos: Role | null) =>
    updateSide(side, (arr) => arr.map((x) => (x.id === id ? { ...x, pos } : x)));
  const removeB = (side: Side, id: string) =>
    updateSide(side, (arr) => arr.filter((x) => x.id !== id));

  const importMatch = (match: MatchImportResponse) => {
    // Build board picks (hero + role) for one side, from the match's player list.
    const sidePicks = (radiantSide: boolean): BoardPick[] =>
      match.players
        .filter((p) => p.hero && HERO_BY_ID[p.hero] && p.is_radiant === radiantSide)
        .slice(0, 5)
        .map((p) => ({ id: p.hero as string, pos: (p.position as Role | null) ?? null }));
    // null or true → treat radiant as the ally side; false → ally is dire.
    const allyRadiant = match.searched_is_radiant !== false;
    setTeam(sidePicks(allyRadiant));
    setEnemy(sidePicks(!allyRadiant));
    setShowBoard(false);
  };

  // Append dictated/parsed heroes to the current board side (skips dupes + full sides).
  const addManyToBoard = (ids: string[]) => {
    const setter = boardTarget === "ally" ? setTeam : setEnemy;
    setter((prev) => {
      const used = new Set<string>([
        ...team.map((x) => x.id),
        ...enemy.map((x) => x.id),
        ...prev.map((x) => x.id),
      ]);
      const next = [...prev];
      for (const id of ids) {
        if (next.length >= 5) break;
        if (!HERO_BY_ID[id] || used.has(id)) continue;
        next.push({ id, pos: null });
        used.add(id);
      }
      return next;
    });
  };

  const bracketFactor = bracketFactorFor(rank);

  // Real win-rate matchups for the enemies on the board (OpenDota, via the API).
  // Falls back to bundled hand-tuned counters in the engine when unavailable.
  const enemyIds = enemy.map((x) => x.id);
  const enemyKey = [...enemyIds].sort().join(",");
  const { data: matchups } = useQuery({
    queryKey: ["matchups", enemyKey],
    queryFn: () => getMatchups(enemyIds),
    enabled: enemyIds.length > 0,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const recs = useMemo<Recommendation[]>(() => {
    const teamHeroes = team
      .map((x) => HERO_BY_ID[x.id])
      .filter((h): h is NonNullable<typeof h> => !!h);
    const used = new Set<string>([...team.map((x) => x.id), ...enemy.map((x) => x.id)]);
    const enemies = enemy
      .map((x) => HERO_BY_ID[x.id])
      .filter((h): h is NonNullable<typeof h> => !!h);
    const eligible = poolIds
      .map((id) => HERO_BY_ID[id])
      .filter((h): h is NonNullable<typeof h> => !!h)
      .filter((h) => h.roles.includes(myRole) && !used.has(h.id));
    return eligible
      .map((h) => ({ hero: h, ...scoreHero(h, teamHeroes, enemies, bracketFactor, matchups) }))
      .sort((a, b) => b.total - a.total || a.hero.name.localeCompare(b.hero.name));
  }, [poolIds, myRole, team, enemy, bracketFactor, matchups]);

  const coachBrief = useMemo(
    () =>
      selectModulesRules(
        buildContext({
          recs,
          allies: team,
          enemies: enemy,
          role: myRole,
          rank,
          bracketFactor,
          matchups,
        }),
      ),
    [recs, team, enemy, myRole, rank, bracketFactor, matchups],
  );

  const contested = team.some((x) => x.pos === myRole);

  return (
    <div
      className="oracle-root min-h-screen w-full px-4 py-6 sm:px-6"
      style={{
        color: "#dfe3ea",
        background:
          "radial-gradient(ellipse 60% 80% at 0% 0%, rgba(116,177,63,.10), transparent 55%),radial-gradient(ellipse 60% 80% at 100% 100%, rgba(209,70,58,.12), transparent 55%),#0a0c0f",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg,#c79a45,#8a6a26)",
              boxShadow: "0 4px 16px rgba(199,154,69,.3)",
            }}
          >
            <Swords size={24} color="#0b0d10" />
          </div>
          <div>
            <h1
              className="oracle-display text-2xl tracking-wider sm:text-3xl"
              style={{ color: "#f0e6cf" }}
            >
              DRAFT ORACLE
            </h1>
            <p className="fs11 sm:text-sm" style={{ color: "#7d8593" }}>
              Picks from <span style={{ color: "#c79a45" }}>your hero pool</span> for{" "}
              <span style={{ color: "#c79a45" }}>your role</span> · weighted by 7.41c meta
            </p>
          </div>
          <div className="ml-auto">
            <MetaStatus />
          </div>
        </header>

        {/* MY POOL */}
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="oracle-display fs11 uppercase tracking-widest"
                style={{ color: "#6b7280" }}
              >
                My role
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setMyRole(r)}
                    className="oracle-display fs11 rounded-md px-2.5 py-1.5 tracking-wide"
                    style={{
                      color: myRole === r ? "#0b0d10" : "#aeb4be",
                      background: myRole === r ? "#c79a45" : "rgba(255,255,255,.04)",
                      border: `1px solid ${myRole === r ? "#c79a45" : "rgba(255,255,255,.08)"}`,
                    }}
                  >
                    {POS_NUM[r]} {r}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPool((s) => !s)}
              className="oracle-display fs11 flex items-center gap-1 rounded-md px-3 py-1.5 tracking-wide"
              style={{ color: "#0b0d10", background: "#74b13f" }}
            >
              <Plus size={13} /> Add hero
            </button>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="oracle-display fs11 uppercase tracking-widest"
              style={{ color: "#6b7280" }}
            >
              My rank
            </span>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value as Rank)}
              className="oracle-mono fs11 rounded-md outline-none"
              style={{
                color: "#0b0d10",
                background: "#c79a45",
                border: "1px solid #c79a45",
                padding: "3px 6px",
              }}
            >
              {RANKS.map((rk) => (
                <option key={rk} value={rk} style={{ color: "#000", background: "#15181e" }}>
                  {rk}
                </option>
              ))}
            </select>
            <span className="fs10 italic" style={{ color: "#6b7280" }}>
              {bracketFactor === 1
                ? "weighting forgiving, self-sufficient carries up"
                : bracketFactor === 0.5
                  ? "mild bracket adjustment"
                  : "raw high-MMR meta"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {poolIds
              .map((id) => HERO_BY_ID[id])
              .filter((h): h is NonNullable<typeof h> => !!h)
              .map((h) => (
                <button
                  type="button"
                  key={h.id}
                  onClick={() => removePool(h.id)}
                  className="group flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2"
                  style={{
                    background: "rgba(0,0,0,.3)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <Portrait hero={h} size={22} />
                  <span className="fs11" style={{ color: "#dfe3ea" }}>
                    {h.name}
                  </span>
                  {META[h.id] && <TierPill tier={META[h.id]?.tier} small />}
                  <X
                    size={12}
                    className="opacity-30 group-hover:opacity-90"
                    style={{ color: "#d1463a" }}
                  />
                </button>
              ))}
            {poolIds.length === 0 && (
              <p className="fs11 italic" style={{ color: "#566070" }}>
                your pool is empty — add the heroes you play
              </p>
            )}
          </div>
          {showPool && (
            <HeroPicker
              onPick={addPool}
              excludeIds={new Set(poolIds)}
              placeholder="add any hero to your pool…"
              accent="#74b13f"
            />
          )}
        </Card>

        {/* MATCH IMPORT */}
        <RecentImport onImport={importMatch} />

        {/* DRAFT BOARD */}
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span
              className="oracle-display fs11 uppercase tracking-widest"
              style={{ color: "#6b7280" }}
            >
              Draft board — you set each hero's position
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  ["ally", "My Team", "#74b13f"],
                  ["enemy", "Enemy", "#d1463a"],
                ] as const
              ).map(([v, label, c]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => {
                    setBoardTarget(v);
                    setShowBoard(true);
                  }}
                  className="oracle-display fs11 rounded-md px-3 py-1.5 tracking-wide"
                  style={{
                    color: boardTarget === v ? "#0b0d10" : c,
                    background: boardTarget === v ? c : "rgba(255,255,255,.04)",
                    border: `1px solid ${c}${boardTarget === v ? "" : "55"}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="fs10 uppercase tracking-widest" style={{ color: "#566070" }}>
              Voice
            </span>
            <MicDictate
              targetLabel={boardTarget === "ally" ? "My Team" : "Enemy"}
              accent={boardTarget === "ally" ? "#74b13f" : "#d1463a"}
              onHeroes={addManyToBoard}
            />
            <span className="fs10 italic" style={{ color: "#566070" }}>
              → adds to {boardTarget === "ally" ? "your team" : "the enemy"}; e.g. say "wraith king,
              lion, crystal maiden"
            </span>
          </div>
          {showBoard && (
            <HeroPicker
              onPick={addBoard}
              excludeIds={boardUsed}
              placeholder={`add a hero to ${boardTarget === "ally" ? "your team" : "the enemy"}…`}
              accent={boardTarget === "ally" ? "#74b13f" : "#d1463a"}
            />
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["ally", team, "#74b13f", "Your Team"],
                ["enemy", enemy, "#d1463a", "Enemy"],
              ] as const
            ).map(([side, arr, accent, label]) => (
              <div
                key={side}
                className="rounded-lg p-2.5"
                style={{ background: "rgba(18,21,27,.6)", border: `1px solid ${accent}44` }}
              >
                <div
                  className="oracle-display fs11 mb-2 uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {label}{" "}
                  <span className="oracle-mono" style={{ color: "#5d6470" }}>
                    {arr.length}/5
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {arr.length === 0 && (
                    <p className="fs11 italic" style={{ color: "#566070" }}>
                      none yet
                    </p>
                  )}
                  {arr.map((it) => {
                    const h = HERO_BY_ID[it.id];
                    if (!h) return null;
                    return (
                      <div
                        key={it.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5"
                        style={{ background: "rgba(0,0,0,.25)" }}
                      >
                        <Portrait hero={h} size={24} />
                        <span className="fs11 flex-1 truncate" style={{ color: "#dfe3ea" }}>
                          {h.name}
                        </span>
                        <PosSelect
                          value={it.pos}
                          onChange={(p) => setPos(side, it.id, p)}
                          accent={accent}
                        />
                        <button type="button" onClick={() => removeB(side, it.id)}>
                          <X
                            size={13}
                            style={{ color: accent }}
                            className="opacity-40 hover:opacity-90"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RECOMMENDATIONS */}
        <div className="mb-2.5 flex items-center gap-2">
          <Sparkles size={16} color="#c79a45" />
          <h2
            className="oracle-display text-sm uppercase tracking-widest"
            style={{ color: "#f0e6cf" }}
          >
            Best {myRole} from your pool
          </h2>
          <span className="oracle-mono fs10 ml-auto" style={{ color: "#6b7280" }}>
            7.41c · {rank}
          </span>
        </div>
        {bracketFactor > 0 && (
          <div
            className="fs11 mb-2.5 flex items-start gap-2 rounded-lg px-3 py-2"
            style={{
              background: "rgba(199,154,69,.1)",
              border: "1px solid rgba(199,154,69,.22)",
              color: "#d9bd86",
            }}
          >
            <Sparkles size={13} className="mt-0.5 shrink-0" /> Tuned for {rank}: forgiving,
            self-sufficient carries are weighted up; high-skill-ceiling heroes (Faceless Void, Kez)
            are weighted down. Switch to Divine/Immortal for the raw pro meta.
          </div>
        )}
        {contested && (
          <div
            className="fs11 mb-2.5 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "rgba(209,70,58,.12)",
              border: "1px solid rgba(209,70,58,.25)",
              color: "#e09a92",
            }}
          >
            <ShieldAlert size={13} /> A teammate is also marked {myRole} — your core role looks
            contested.
          </div>
        )}
        {recs.length > 0 && <CoachPanel brief={coachBrief} />}
        {recs.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "rgba(15,18,23,.5)", border: "1px dashed rgba(255,255,255,.1)" }}
          >
            <Crosshair size={26} color="#3a4049" className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#7d8593" }}>
              No heroes in your pool can play {myRole}. Add some with "Add hero," or switch your
              role.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recs.map((r, i) => {
              const open = expandedId === r.hero.id || (expandedId === null && i === 0);
              const g = open ? buildGuide(r.hero, enemyHeroes) : null;
              return (
                <div
                  key={r.hero.id}
                  className="rise rounded-xl p-3"
                  style={{
                    animationDelay: `${i * 55}ms`,
                    background: "rgba(17,20,26,.8)",
                    border: open
                      ? "1px solid rgba(199,154,69,.4)"
                      : "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? "__none__" : r.hero.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span
                      className="oracle-display w-5 text-center text-lg"
                      style={{ color: i === 0 ? "#c79a45" : "#4b5563" }}
                    >
                      {i + 1}
                    </span>
                    <Portrait hero={r.hero} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate text-base font-medium"
                          style={{ color: "#f0e6cf" }}
                        >
                          {r.hero.name}
                        </span>
                        {r.meta && <TierPill tier={r.meta.tier} />}
                        {i === 0 && <Star size={13} color="#c79a45" fill="#c79a45" />}
                      </div>
                      <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,.07)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(4, Math.min(100, ((r.total + 3) / 14) * 100))}%`,
                            background:
                              r.total >= 0
                                ? "linear-gradient(90deg,#3f8fd1,#74b13f)"
                                : "linear-gradient(90deg,#7a3b35,#d1463a)",
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="oracle-mono text-sm font-bold"
                      style={{ color: r.total >= 0 ? "#74b13f" : "#d1463a" }}
                    >
                      {r.total >= 0 ? "+" : ""}
                      {r.total.toFixed(1)}
                    </span>
                    <ChevronDown
                      size={16}
                      color="#6b7280"
                      style={{
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform .2s",
                      }}
                    />
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
                    {r.reasons.slice(0, 5).map((rs) => (
                      <span
                        key={rs.label}
                        className="fs11 rounded-full px-2 py-0.5"
                        style={{
                          color: rs.w >= 0 ? "#a9d488" : "#e09a92",
                          background: rs.w >= 0 ? "rgba(116,177,63,.12)" : "rgba(209,70,58,.12)",
                          border: `1px solid ${rs.w >= 0 ? "rgba(116,177,63,.25)" : "rgba(209,70,58,.25)"}`,
                        }}
                      >
                        {rs.label}
                      </span>
                    ))}
                    {r.reasons.length === 0 && (
                      <span className="fs11 italic" style={{ color: "#566070" }}>
                        solid neutral pick
                      </span>
                    )}
                  </div>

                  {open && g && (
                    <div
                      className="mt-3 pl-8 pt-3"
                      style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Coins size={12} color="#c79a45" />
                        <span
                          className="oracle-display fs10 uppercase tracking-widest"
                          style={{ color: "#8a7a55" }}
                        >
                          Core build path
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1">
                        {g.path.map((it, k) => (
                          <Fragment key={it}>
                            <span
                              className="fs11 inline-flex items-center gap-1 rounded-md px-2 py-0.5"
                              style={
                                it === g.key
                                  ? { color: "#0b0d10", background: "#c79a45", fontWeight: 700 }
                                  : {
                                      color: "#cfd4dc",
                                      background: "rgba(255,255,255,.05)",
                                      border: "1px solid rgba(255,255,255,.08)",
                                    }
                              }
                            >
                              {it === g.key && <Star size={10} fill="#0b0d10" color="#0b0d10" />}
                              {it}
                            </span>
                            {k < g.path.length - 1 && <span style={{ color: "#4b5563" }}>›</span>}
                          </Fragment>
                        ))}
                      </div>
                      <p className="fs11 mb-3 italic" style={{ color: "#8b93a1" }}>
                        {g.note}
                      </p>
                      {bracketFactor === 1 && (
                        <p className="fs11 mb-3 italic" style={{ color: "#c79a45" }}>
                          {rank} tip: don't skip BKB for greedy damage — pubs at this rank will jump
                          you. Farm efficiently and buy your defensive item on time.
                        </p>
                      )}

                      <span
                        className="oracle-display fs10 uppercase tracking-widest"
                        style={{ color: "#8a7a55" }}
                      >
                        Tune vs this lineup
                      </span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {g.situational.length === 0 ? (
                          <p className="fs11 italic" style={{ color: "#566070" }}>
                            Add the enemy lineup above to get tailored timing (BKB vs magic, MKB vs
                            evasion, cleave vs illusions…).
                          </p>
                        ) : (
                          g.situational.map((it) => (
                            <div
                              key={it.item}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5"
                              style={{
                                background: "rgba(199,154,69,.08)",
                                border: "1px solid rgba(199,154,69,.2)",
                              }}
                            >
                              <span
                                className="fs11 shrink-0 font-bold"
                                style={{ color: "#e0bf7a" }}
                              >
                                {it.item}
                              </span>
                              <span className="fs11" style={{ color: "#9aa1ad" }}>
                                — {it.reason}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <a
                        href={`https://www.dotabuff.com/heroes/${dotabuffSlug(r.hero.name)}/guides`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="oracle-mono fs10 mt-2.5 inline-flex items-center gap-1"
                        style={{ color: "#6b7280" }}
                      >
                        Build basis: 7.41c pub &amp; pro trends · full guide ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="fs11 mt-4 flex items-start gap-2" style={{ color: "#5d6470" }}>
          <ShieldAlert size={13} className="mt-0.5 shrink-0" />
          <p className="oracle-root italic">
            Suggests only heroes from your pool that can play {myRole}, ranked by 7.41c meta tier
            plus matchups vs the enemy board and synergy with your team. Meta read is hand-tuned
            from current DotaBuff / Dota2ProTracker trends and will drift as Valve patches —
            re-check before relying on it in ranked.
          </p>
        </div>
      </div>
    </div>
  );
}

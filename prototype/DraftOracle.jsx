import React, { useState, useMemo } from "react";
import { Swords, X, Crosshair, Sparkles, ShieldAlert, Search, Plus, Star, ChevronDown, Coins } from "lucide-react";

/* ----------------------------------------------------------------
   ROSTER — full Dota 2 hero pool (through Largo, 7.41c).
   "Name|attr|roles|tags"; roles c=Carry m=Mid o=Offlane s=Support h=Hard Support
-----------------------------------------------------------------*/
const ROLE_MAP = { c: "Carry", m: "Mid", o: "Offlane", s: "Support", h: "Hard Support" };
const ROLES = ["Carry", "Mid", "Offlane", "Support", "Hard Support"];
const POS_NUM = { Carry: "1", Mid: "2", Offlane: "3", Support: "4", "Hard Support": "5" };
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const dotabuffSlug = (n) => n.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const RAW = [
  "Abaddon|uni|s,o,c|tanky", "Alchemist|str|c,m,o|tanky,physical-dps",
  "Ancient Apparition|int|h,s|spell-reliant,squishy,immobile,aoe-control",
  "Anti-Mage|agi|c|mobility,mana-burn,physical-dps,passive-reliant",
  "Arc Warden|agi|c,m|magic-burst,physical-dps,squishy,mana-dependent",
  "Axe|str|o|tanky,lockdown,aoe-disable,aoe-control", "Bane|uni|h,s|lockdown,spell-reliant,squishy,immobile",
  "Batrider|uni|o,m,s|lockdown,spell-reliant,mobility,aoe-control", "Beastmaster|uni|o|tanky,lockdown,summon",
  "Bloodseeker|agi|c,o,m|physical-dps,silence,mobility,passive-reliant", "Bounty Hunter|agi|s|mobility,physical-dps",
  "Brewmaster|str|o,c|tanky,lockdown,evasion", "Bristleback|str|o|tanky,physical-dps,passive-reliant",
  "Broodmother|agi|m,o,c|physical-dps,summon,mobility", "Centaur Warrunner|str|o|tanky,aoe-disable,aoe-control",
  "Chaos Knight|str|c,o|illusion,physical-dps,lockdown", "Chen|uni|s,h|summon,squishy,immobile",
  "Clinkz|agi|c,m|physical-dps,mobility,squishy", "Clockwerk|uni|o,s|lockdown,tanky,mobility",
  "Crystal Maiden|int|h|squishy,immobile,aoe-control,lockdown,mana-aura,spell-reliant",
  "Dark Seer|uni|o|aoe-control,tanky", "Dark Willow|uni|s,h|lockdown,magic-burst,spell-reliant,squishy",
  "Dawnbreaker|str|o,s,c|tanky,aoe-disable,mobility", "Dazzle|int|h,s|spell-reliant,squishy,immobile",
  "Death Prophet|int|m,o|magic-burst,silence,spell-reliant,tanky,summon",
  "Disruptor|int|h,s|aoe-control,lockdown,silence,spell-reliant,squishy,immobile",
  "Doom|uni|o,m|lockdown,silence,break,tanky", "Dragon Knight|str|m,o,c|tanky,lockdown,physical-dps",
  "Drow Ranger|agi|c|physical-dps,squishy,immobile,passive-reliant", "Earth Spirit|uni|s|lockdown,mobility,aoe-control",
  "Earthshaker|str|s|aoe-disable,aoe-control,magic-burst,lockdown", "Elder Titan|uni|o,s|aoe-disable,aoe-control,tanky",
  "Ember Spirit|agi|m,c|mobility,physical-dps,magic-burst,squishy", "Enchantress|uni|s,o,c|summon,physical-dps,squishy",
  "Enigma|uni|o,s|summon,aoe-control,aoe-disable",
  "Faceless Void|agi|c|aoe-control,aoe-disable,physical-dps,lockdown,passive-reliant",
  "Grimstroke|int|h,s|lockdown,magic-burst,spell-reliant,silence,squishy,immobile",
  "Gyrocopter|agi|c,s|physical-dps,magic-burst,aoe-disable", "Hoodwink|agi|s,h|mobility,magic-burst,spell-reliant,squishy",
  "Huskar|str|c,m,o|physical-dps,tanky,passive-reliant",
  "Invoker|uni|m|spell-reliant,magic-burst,aoe-control,squishy,mana-dependent", "Io|uni|s,h|mobility",
  "Jakiro|int|h,s|aoe-control,magic-burst,spell-reliant,immobile,squishy", "Juggernaut|agi|c|physical-dps,mobility",
  "Keeper of the Light|int|h,m|magic-burst,spell-reliant,squishy,immobile,mana-aura,mana-dependent",
  "Kez|agi|c,m|physical-dps,mobility", "Kunkka|str|m,o,c,s|aoe-control,aoe-disable,physical-dps,tanky",
  "Largo|uni|s,h|aoe-control,lockdown", "Legion Commander|str|o,c|physical-dps,lockdown,tanky",
  "Leshrac|uni|m,o|magic-burst,spell-reliant,aoe-control,squishy,immobile",
  "Lich|int|h|magic-burst,aoe-control,spell-reliant,squishy,immobile",
  "Lifestealer|str|c|physical-dps,tanky,mobility,passive-reliant", "Lina|uni|m|magic-burst,spell-reliant,squishy,immobile,lockdown",
  "Lion|int|h|lockdown,magic-burst,spell-reliant,squishy,immobile,mana-burn", "Lone Druid|uni|c,o|summon,physical-dps,tanky",
  "Luna|agi|c|physical-dps,aoe-disable,squishy", "Lycan|uni|o,c,m|summon,physical-dps,mobility,tanky",
  "Magnus|uni|o,s|aoe-control,aoe-disable", "Marci|uni|s,c,o|physical-dps,mobility,lockdown,tanky",
  "Mars|str|o|tanky,aoe-control,lockdown,aoe-disable", "Medusa|agi|c|physical-dps,mana-dependent,tanky",
  "Meepo|agi|c,m|physical-dps,summon,mobility", "Mirana|uni|s,m,c|lockdown,physical-dps,mobility,aoe-control",
  "Monkey King|agi|c,o,m|physical-dps,mobility,aoe-disable", "Morphling|agi|c,m|physical-dps,mobility",
  "Muerta|int|c,m,s|physical-dps,magic-burst,spell-reliant", "Naga Siren|agi|c,o,s|illusion,physical-dps,aoe-control,aoe-disable",
  "Nature's Prophet|int|m,o,c,s|summon,mobility", "Necrophos|int|c,m,o|magic-burst,tanky,spell-reliant",
  "Night Stalker|str|o,c|physical-dps,silence,tanky", "Nyx Assassin|agi|s|mobility,lockdown,mana-burn,spell-reflect",
  "Ogre Magi|int|h,s|lockdown,magic-burst,tanky,spell-reliant", "Omniknight|str|s,h,o|tanky",
  "Oracle|int|h,s|spell-reliant,squishy,immobile", "Outworld Destroyer|int|m,c|magic-burst,aoe-disable,mana-dependent",
  "Pangolier|uni|o,m,c,s|mobility,aoe-control,physical-dps,tanky",
  "Phantom Assassin|agi|c|physical-dps,mobility,evasion,passive-reliant", "Phantom Lancer|agi|c|illusion,physical-dps,mobility",
  "Phoenix|uni|o,s|aoe-control,tanky,magic-burst", "Primal Beast|str|o,m,s|tanky,lockdown,aoe-disable,mobility",
  "Puck|int|m|mobility,magic-burst,spell-reliant,aoe-control,squishy", "Pudge|str|o,s,m|lockdown,tanky,magic-burst",
  "Pugna|int|h,m|magic-burst,spell-reliant,squishy", "Queen of Pain|int|m|mobility,magic-burst,spell-reliant,squishy",
  "Razor|agi|m,o,c|physical-dps,aoe-control", "Riki|agi|c,s|physical-dps,mobility,silence",
  "Ringmaster|uni|s,h|lockdown,aoe-control,spell-reliant", "Rubick|int|h,s|lockdown,spell-reliant,squishy,immobile,aoe-control",
  "Sand King|uni|o,s,m|aoe-control,aoe-disable,mobility,tanky", "Shadow Demon|uni|h,s|lockdown,spell-reliant,squishy,aoe-control",
  "Shadow Fiend|agi|c,m|physical-dps,magic-burst,squishy,immobile",
  "Shadow Shaman|int|h,s|lockdown,summon,spell-reliant,squishy,immobile",
  "Silencer|int|s,h,m|silence,spell-reliant,squishy,immobile,magic-burst",
  "Skywrath Mage|int|h,s|magic-burst,spell-reliant,squishy,immobile,silence", "Slardar|str|o,c,s|physical-dps,lockdown,tanky",
  "Slark|agi|c,m|physical-dps,mobility", "Snapfire|uni|s,h,m|aoe-control,magic-burst,lockdown",
  "Sniper|agi|c|physical-dps,squishy,immobile", "Spectre|agi|c|tanky,physical-dps,passive-reliant",
  "Spirit Breaker|str|s|mobility,lockdown,tanky", "Storm Spirit|int|m|mobility,magic-burst,spell-reliant,mana-dependent,squishy",
  "Sven|str|c|physical-dps,aoe-disable,mobility,aoe-control", "Techies|uni|s,m,o|magic-burst,aoe-control,spell-reliant",
  "Templar Assassin|agi|m,c|physical-dps,magic-burst,mobility,squishy", "Terrorblade|agi|c,m|illusion,physical-dps",
  "Tidehunter|str|o|tanky,aoe-control,aoe-disable", "Timbersaw|str|o,m|tanky,magic-burst,mobility,spell-reliant",
  "Tinker|int|m|spell-reliant,magic-burst,immobile,squishy,mana-dependent", "Tiny|str|m,o,c,s|lockdown,physical-dps,aoe-disable,tanky",
  "Treant Protector|str|h,o,s|lockdown,tanky,spell-reliant,aoe-disable,aoe-control", "Troll Warlord|agi|c,o|physical-dps,lockdown,evasion",
  "Tusk|str|s|mobility,lockdown", "Underlord|str|o|tanky,aoe-control", "Undying|str|o,s|tanky,aoe-control,summon",
  "Ursa|agi|c,o|physical-dps,passive-reliant", "Vengeful Spirit|uni|s,h|lockdown,squishy",
  "Venomancer|uni|o,s,h|summon,aoe-control,spell-reliant,squishy", "Viper|agi|m,o,c|physical-dps,magic-burst,tanky",
  "Visage|int|o,s,m|summon,magic-burst", "Void Spirit|uni|m,c|mobility,magic-burst,aoe-control",
  "Warlock|uni|h,s|summon,aoe-control,spell-reliant", "Weaver|agi|c,m,o,s|physical-dps,mobility,squishy,passive-reliant",
  "Windranger|uni|m,o,s,c|lockdown,physical-dps,magic-burst,squishy,evasion",
  "Winter Wyvern|int|h,s|aoe-control,spell-reliant,squishy,immobile", "Witch Doctor|int|h|magic-burst,aoe-control,squishy,immobile,spell-reliant",
  "Wraith King|str|c,o,s|physical-dps,tanky,lockdown", "Zeus|int|m|magic-burst,spell-reliant,squishy,immobile,aoe-control",
];

// extra tags consumed only by the item engine (don't affect counter scoring)
const EXTRA_TAGS = {
  riki: ["invis"], clinkz: ["invis"], "bounty-hunter": ["invis"], mirana: ["invis"], slark: ["invis"], weaver: ["invis"], "sand-king": ["invis"], broodmother: ["invis"], "nyx-assassin": ["invis"],
  "wraith-king": ["heal"], necrophos: ["heal"], huskar: ["heal"], abaddon: ["heal"], dazzle: ["heal"], omniknight: ["heal"], alchemist: ["heal"], lifestealer: ["heal"], undying: ["heal"], warlock: ["heal"], "treant-protector": ["heal"], dawnbreaker: ["heal"],
};

const HEROES = RAW.map((line) => {
  const [name, attr, roles, tags] = line.split("|");
  const id = slug(name);
  return { id, name, attr, roles: roles.split(",").map((r) => ROLE_MAP[r]), tags: [...(tags ? tags.split(",") : []), ...(EXTRA_TAGS[id] || [])] };
}).sort((a, b) => a.name.localeCompare(b.name));
const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]));
const ATTR_COLOR = { str: "#d14b3c", agi: "#74b13f", int: "#3f8fd1", uni: "#c79a45" };

const COUNTERS = {
  "anti-mage": ["medusa", "storm-spirit", "invoker", "tinker", "leshrac"],
  doom: ["storm-spirit", "invoker", "tinker", "queen-of-pain", "medusa", "ember-spirit"],
  silencer: ["storm-spirit", "invoker", "queen-of-pain", "leshrac", "zeus", "tinker"],
  "nyx-assassin": ["lina", "zeus", "queen-of-pain", "invoker", "storm-spirit", "tinker", "skywrath-mage", "leshrac"],
  pugna: ["zeus", "lina", "queen-of-pain", "storm-spirit", "invoker", "tinker", "skywrath-mage"],
  "spirit-breaker": ["sniper", "drow-ranger", "crystal-maiden", "tinker", "storm-spirit", "lina", "skywrath-mage"],
  "phantom-assassin": ["crystal-maiden", "lion", "witch-doctor", "sniper", "skywrath-mage"],
  axe: ["phantom-lancer", "spectre", "sven", "meepo", "naga-siren"],
  earthshaker: ["phantom-lancer", "meepo", "naga-siren", "broodmother"],
  disruptor: ["storm-spirit", "anti-mage", "queen-of-pain", "ember-spirit", "void-spirit", "weaver"],
  "legion-commander": ["huskar", "bristleback", "lifestealer", "wraith-king"],
  "ancient-apparition": ["huskar", "wraith-king", "alchemist", "necrophos", "abaddon", "spectre"],
  slardar: ["riki", "bounty-hunter", "weaver", "phantom-assassin"],
  bloodseeker: ["storm-spirit", "ember-spirit", "void-spirit", "weaver"],
  razor: ["phantom-assassin", "troll-warlord", "sven", "juggernaut"],
  necrophos: ["huskar", "bristleback", "wraith-king"],
  lion: ["medusa", "storm-spirit"], mars: ["drow-ranger", "sniper", "medusa"],
  tidehunter: ["phantom-lancer", "naga-siren", "meepo"], juggernaut: ["lion", "crystal-maiden", "queen-of-pain"],
  spectre: ["sniper", "drow-ranger", "tinker"], medusa: ["phantom-lancer", "drow-ranger"],
  sven: ["phantom-lancer", "meepo", "naga-siren"], "phantom-lancer": ["drow-ranger", "sniper"],
  invoker: ["drow-ranger", "sniper", "crystal-maiden"], "storm-spirit": ["drow-ranger", "sniper", "crystal-maiden", "tinker"],
  "queen-of-pain": ["crystal-maiden", "sniper", "drow-ranger"], "shadow-fiend": ["drow-ranger", "sniper"],
  lina: ["crystal-maiden", "sniper", "drow-ranger"], tinker: ["medusa", "sniper", "drow-ranger"],
  zeus: ["phantom-lancer", "naga-siren"], tusk: ["sniper", "drow-ranger", "crystal-maiden"],
  clockwerk: ["sniper", "drow-ranger", "tinker", "crystal-maiden", "invoker"],
  viper: ["weaver", "templar-assassin", "queen-of-pain"],
};

const SYNERGIES = {
  magnus: ["faceless-void", "sven", "phantom-assassin", "shadow-fiend", "earthshaker", "invoker", "luna", "gyrocopter", "juggernaut"],
  "faceless-void": ["disruptor", "lina", "sven", "invoker", "warlock", "witch-doctor", "jakiro"],
  earthshaker: ["faceless-void", "magnus", "dark-seer", "enigma"], tidehunter: ["lina", "invoker", "sven", "shadow-fiend", "luna"],
  enigma: ["faceless-void", "magnus", "invoker", "lina"], "dark-seer": ["earthshaker", "kunkka", "sven", "tidehunter"],
  "crystal-maiden": ["storm-spirit", "invoker", "tinker", "leshrac"], disruptor: ["faceless-void", "sven", "lina", "gyrocopter"],
  warlock: ["faceless-void", "magnus", "enigma"], io: ["gyrocopter", "spectre", "tiny", "ursa", "wraith-king", "juggernaut"],
  "vengeful-spirit": ["sven", "drow-ranger", "luna", "gyrocopter", "wraith-king"], sven: ["crystal-maiden"],
  axe: ["disruptor", "lina", "zeus", "witch-doctor"], mars: ["lina", "invoker", "kunkka"],
  "witch-doctor": ["earthshaker", "lion", "axe"], "wraith-king": ["lich", "warlock", "crystal-maiden"],
  invoker: ["faceless-void", "magnus", "tidehunter", "enigma"],
};

/* 7.41c carry-meta read (hand-tuned from DotaBuff / D2PT / patch coverage) */
const TIERW = { S: 3, A: 2, B: 1, C: -0.5, D: -1.5 };
const META = {
  spectre: { tier: "S", note: "patch's standout winner — calmer early game lets her farm & scale (~55% WR)" },
  "wraith-king": { tier: "S", note: "one of the highest win rates this patch (~54%)" },
  "faceless-void": { tier: "A", note: "most-picked carry; Battlefury + Aghs Chrono build (~53%)" },
  "drow-ranger": { tier: "A", note: "benefited from the slower tempo (~53.5% WR)" },
  juggernaut: { tier: "A", note: "strong lane, healing ward + Omnislash pickoffs" },
  sniper: { tier: "A", note: "back in the meta — easier after mobility-hero nerfs" },
  "phantom-assassin": { tier: "B", note: "reliable single-target pickoff carry" },
  kez: { tier: "B", note: "viable agi carry, limited high-MMR data" },
  "shadow-fiend": { tier: "C", note: "niche as a pos-1 this patch" },
  necrophos: { tier: "C", note: "off-meta as a hard carry" },
  slark: { tier: "S", note: "top-tier high-tempo durability, innate-driven" },
  lifestealer: { tier: "S", note: "%-based damage + magic immunity, dominant" },
  "phantom-lancer": { tier: "A", note: "niche but strong after the tempo nerfs" },
  terrorblade: { tier: "A", note: "high win rate (~57%) this patch" },
  "chaos-knight": { tier: "A", note: "Chaos Strike buffs delete squishies" },
  ursa: { tier: "A", note: "topped pos-1 win rate earlier in 7.41" },
  meepo: { tier: "A", note: "snowballs hard if you can pilot him" },
  "naga-siren": { tier: "A", note: "elite farmer + Song teamfight control" },
  medusa: { tier: "B", note: "tanky scaler, but mana-burn vulnerable" },
  morphling: { tier: "B", note: "flexible, very skill-intensive" },
  luna: { tier: "B", note: "fast farmer, cleave teamfights" },
  riki: { tier: "B", note: "pickoff carry, niche" }, clinkz: { tier: "B", note: "burst pickoff carry" },
  "troll-warlord": { tier: "B", note: "bullies the lane, falls off late" },
  alchemist: { tier: "D", note: "gutted by gold/sustain nerfs" },
  "lone-druid": { tier: "D", note: "heavy nerfs, fell off hard" },
  "anti-mage": { tier: "D", note: "too slow for the 7.41c tempo" },
  "templar-assassin": { tier: "C", note: "underwhelming this patch" },
  sven: { tier: "B", note: "huge Cleave crits + God's Strength; a pub wrecking ball" },
};
const TIER_COLOR = { S: "#c79a45", A: "#74b13f", B: "#3f8fd1", C: "#7d8593", D: "#d1463a" };

/* Rank / bracket awareness. Crusader–Archon pubs reward forgiving, self-sufficient,
   snowbally carries and punish high-skill-ceiling heroes. */
const RANKS = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];
// factor applied to BRACKET_FIT weights: full in low brackets, half in mid, none up top
const bracketFactorFor = (rank) => {
  const i = RANKS.indexOf(rank);
  if (i <= 3) return 1;       // Herald–Archon
  if (i <= 5) return 0.5;     // Legend–Ancient
  return 0;                   // Divine–Immortal (use raw pro meta)
};
const BRACKET_FIT = {
  "wraith-king": { w: 1.5, note: "Crusader/Archon wrecking ball — tanky & forgiving" },
  "phantom-assassin": { w: 1.5, note: "pubstomper — crits & evasion punish low brackets" },
  lifestealer: { w: 1.5, note: "super forgiving — Rage is a built-in BKB" },
  sven: { w: 1.5, note: "low-bracket monster — Cleave crits one-shot" },
  juggernaut: { w: 1, note: "easy & self-sufficient — great at this rank" },
  "drow-ranger": { w: 1, note: "right-click bully vs disorganized pubs" },
  sniper: { w: 1, note: "safe-range damage thrives in scrappy games" },
  luna: { w: 1, note: "simple cleave farmer, strong at this rank" },
  spectre: { w: 1, note: "long games & loose map play feed her comebacks" },
  ursa: { w: 1, note: "simple & snowbally — great at this rank" },
  "troll-warlord": { w: 1, note: "lane bully that stomps pubs" },
  "chaos-knight": { w: 0.5, note: "early-mid illusion spike stomps pubs" },
  medusa: { w: 0.5, note: "tanky & forgiving, but slow to come online" },
  slark: { w: 0.5, note: "snowbally, but punishes mistimed fights" },
  necrophos: { w: 0.5, note: "tanky caster-core, simple to pilot" },
  terrorblade: { w: -0.5, note: "illusion management trips up low brackets" },
  "templar-assassin": { w: -1, note: "positioning-heavy, easy to misplay here" },
  "faceless-void": { w: -1.5, note: "high skill ceiling — Chrono is easy to whiff here" },
  kez: { w: -1.5, note: "mechanically demanding & new — hard to pilot at this rank" },
  morphling: { w: -2, note: "very hard to execute below high MMR" },
  meepo: { w: -2.5, note: "extreme micro — avoid until Ancient+" },
};

/* ----------------------------------------------------------------
   ENGINE
-----------------------------------------------------------------*/
const has = (h, tag) => h.tags.includes(tag);
const EDGE_TEXT = {
  silence: (a, d) => `${a.name}'s silence shuts down ${d.name}`,
  break: (a, d) => `${a.name} breaks ${d.name}'s passive`,
  units: (a, d) => `${a.name} clears ${d.name}'s illusions/summons`,
  "mana-burn": (a, d) => `${a.name} starves ${d.name}'s mana`,
  lockdown: (a, d) => `${a.name} locks down ${d.name}`,
  "gap-close": (a, d) => `${a.name} gap-closes onto ${d.name}`,
  reflect: (a, d) => `${a.name} reflects ${d.name}'s nukes`,
  burst: (a, d) => `${a.name} bursts ${d.name} down`,
  evasion: (a, d) => `${d.name}'s evasion blunts ${a.name}'s hits`,
};
function tagEdges(a, d) {
  const e = [];
  if (has(a, "silence") && has(d, "spell-reliant")) e.push({ w: 1.5, kind: "silence" });
  if (has(a, "break") && has(d, "passive-reliant")) e.push({ w: 1.5, kind: "break" });
  if (has(a, "aoe-control") && (has(d, "illusion") || has(d, "summon"))) e.push({ w: 1.4, kind: "units" });
  if (has(a, "mana-burn") && has(d, "mana-dependent")) e.push({ w: 1.2, kind: "mana-burn" });
  if (has(a, "lockdown") && has(d, "squishy") && has(d, "immobile")) e.push({ w: 1.2, kind: "lockdown" });
  else if (has(a, "mobility") && has(d, "squishy") && has(d, "immobile")) e.push({ w: 1.0, kind: "gap-close" });
  if (has(a, "spell-reflect") && has(d, "magic-burst")) e.push({ w: 1.2, kind: "reflect" });
  if (has(a, "magic-burst") && has(d, "squishy") && !has(d, "immobile")) e.push({ w: 0.7, kind: "burst" });
  if (has(d, "evasion") && has(a, "physical-dps") && !has(a, "break")) e.push({ w: -1.0, kind: "evasion" });
  return e;
}
function scoreHero(cand, team, enemies, bracketFactor = 0) {
  let total = 0;
  const reasons = [];
  const push = (w, label) => reasons.push({ w, label });
  const meta = META[cand.id];
  if (meta) { const w = TIERW[meta.tier]; total += w; push(w, `7.41c ${meta.tier}-tier · ${meta.note}`); }
  const bf = BRACKET_FIT[cand.id];
  if (bf && bracketFactor > 0) { const w = bf.w * bracketFactor; total += w; push(w, bf.note); }
  const counters = COUNTERS[cand.id] || [];
  enemies.forEach((e) => {
    if (counters.includes(e.id)) { total += 3; push(3, `Hard counter vs ${e.name}`); }
    if ((COUNTERS[e.id] || []).includes(cand.id)) { total -= 2.5; push(-2.5, `${e.name} hard-counters you`); }
    tagEdges(cand, e).forEach((ed) => { total += ed.w; push(ed.w, EDGE_TEXT[ed.kind](cand, e)); });
    tagEdges(e, cand).filter((ed) => ed.w > 0).forEach((ed) => { const w = -ed.w * 0.9; total += w; push(w, "⚠ " + EDGE_TEXT[ed.kind](e, cand)); });
  });
  team.forEach((t) => {
    const combo = (SYNERGIES[cand.id] || []).includes(t.id) || (SYNERGIES[t.id] || []).includes(cand.id);
    if (combo) { total += 2; push(2, `Combos with ${t.name}`); }
    if ((has(t, "aoe-control") || has(t, "aoe-disable")) && has(cand, "physical-dps")) { total += 0.5; push(0.5, `${t.name} sets up your fights`); }
    if (has(t, "mana-aura") && has(cand, "mana-dependent")) { total += 0.6; push(0.6, `${t.name} feeds your mana`); }
  });
  const seen = new Map();
  reasons.forEach((r) => { const p = seen.get(r.label); if (!p || Math.abs(r.w) > Math.abs(p.w)) seen.set(r.label, r); });
  return { total, meta, reasons: [...seen.values()].sort((x, y) => Math.abs(y.w) - Math.abs(x.w)) };
}

/* ----------------------------------------------------------------
   ITEM / BUYING STRATEGY ENGINE
   Each build: key (signature timing item), path (sequence), note.
   Situational items are computed from the enemy lineup's tags.
-----------------------------------------------------------------*/
const CORE_BUILDS = {
  juggernaut: { key: "Manta Style", path: ["Power Treads", "Magic Wand", "Battle Fury", "Manta Style", "Black King Bar", "Butterfly", "Satanic"], note: "Battle Fury to farm, Manta to split-push & dodge a key spell; BKB before you commit Omnislash. (Maelstrom → Mjollnir is the alt farming route.)" },
  "wraith-king": { key: "Radiance", path: ["Power Treads", "Magic Wand", "Sange and Yasha", "Radiance", "Black King Bar", "Heart of Tarrasque", "Assault Cuirass"], note: "Sange & Yasha for early tankiness (no Armlet toggling), then rush Radiance — it's for farming, not fighting. Heart + AC make your Reincarnation a teamfight nightmare." },
  spectre: { key: "Radiance", path: ["Power Treads", "Magic Wand", "Radiance", "Manta Style", "Eye of Skadi", "Black King Bar", "Abyssal Blade"], note: "Rush Radiance for farm, not fights; Manta + Skadi to scale, then win with Haunt pickoffs. Basher/Abyssal to lock a target down." },
  kez: { key: "Maelstrom", path: ["Power Treads", "Magic Wand", "Maelstrom", "Black King Bar", "Manta Style", "Basher", "Abyssal Blade"], note: "Newer hero, builds still settling — flexible agi pickoff path; swap toward Diffusal/Desolator depending on what you need to kill." },
  necrophos: { key: "Eternal Shroud", path: ["Power Treads", "Magic Wand", "Eternal Shroud", "Aghanim's Scepter", "Shiva's Guard", "Heart of Tarrasque"], note: "Plays as a tanky caster-core, not a right-clicker — Shroud + Heart stack HP & spell lifesteal; Aghs Reaper's Scythe hard-counters heal & buyback." },
  "faceless-void": { key: "Battle Fury", path: ["Power Treads", "Mask of Madness", "Battle Fury", "Aghanim's Scepter", "Black King Bar", "Manta Style", "Daedalus"], note: "The 7.41c Battlefury + Aghs build keeps you proactive even when Chrono is down; MoM → Maelstrom is the alt vs a hero you must kill fast (e.g. Anti-Mage)." },
  "drow-ranger": { key: "Dragon Lance", path: ["Power Treads", "Magic Wand", "Dragon Lance", "Hurricane Pike", "Manta Style", "Black King Bar", "Eye of Skadi"], note: "Dragon Lance → Hurricane Pike to hit from safety; Manta dispels & adds DPS, Mjollnir/Aghs/Daedalus to scale. You're fragile — stand behind your frontline." },
  "phantom-assassin": { key: "Battle Fury", path: ["Power Treads", "Magic Wand", "Battle Fury", "Desolator", "Black King Bar", "Aghanim's Shard", "Satanic"], note: "Battle Fury to farm (or rush Desolator if snowballing) → Deso to delete cores; Aghs Shard's Fan of Knives breaks tanky passives (Bristleback/Huskar/DK). Abyssal/Bloodthorn to finish." },
  sniper: { key: "Maelstrom", path: ["Power Treads", "Magic Wand", "Maelstrom", "Dragon Lance", "Hurricane Pike", "Black King Bar", "Satanic"], note: "Stay at max range — Maelstrom/Mjollnir to farm & teamfight, Hurricane Pike to escape gap-closers; MKB if they stack evasion." },
  "shadow-fiend": { key: "Black King Bar", path: ["Boots of Travel", "Magic Wand", "Black King Bar", "Blink Dagger", "Aghanim's Shard", "Daedalus", "Satanic"], note: "Farm fast on souls; Blink + BKB to land Requiem of Souls. Eul's is a fine alt initiation/setup pickup." },
  slark: { key: "Echo Sabre", path: ["Power Treads", "Magic Wand", "Echo Sabre", "Silver Edge", "Black King Bar", "Eye of Skadi", "Abyssal Blade"], note: "Snowball on stolen stats; Silver Edge for pickoffs + break." },
  lifestealer: { key: "Sange and Yasha", path: ["Phase Boots", "Magic Wand", "Sange and Yasha", "Black King Bar", "Abyssal Blade", "Satanic", "Heart of Tarrasque"], note: "Rage is your built-in BKB; Infest a creep for surprise pickoffs." },
  terrorblade: { key: "Dragon Lance", path: ["Power Treads", "Magic Wand", "Dragon Lance", "Manta Style", "Black King Bar", "Eye of Skadi", "Butterfly"], note: "Illusions push & farm; Sunder flips fights, Manta clears dispels." },
  ursa: { key: "Battle Fury", path: ["Phase Boots", "Magic Wand", "Battle Fury", "Black King Bar", "Blink Dagger", "Abyssal Blade", "Satanic"], note: "Fury stacks Fury Swipes; BKB + Blink to jump and shred heroes/Roshan." },
  "chaos-knight": { key: "Blink Dagger", path: ["Power Treads", "Magic Wand", "Sange and Yasha", "Blink Dagger", "Black King Bar", "Heart of Tarrasque", "Assault Cuirass"], note: "Blink + Reality Rift to burst a target with illusions — strong early-mid spike." },
  medusa: { key: "Manta Style", path: ["Power Treads", "Magic Wand", "Manta Style", "Eye of Skadi", "Black King Bar", "Butterfly", "Skadi"], note: "Mana Shield is your effective HP; scales into a teamfight monster with Stone Gaze." },
  luna: { key: "Manta Style", path: ["Power Treads", "Magic Wand", "Manta Style", "Black King Bar", "Aghanim's Scepter", "Butterfly", "Satanic"], note: "Glaive cleave farms fast; Eclipse + Aghs nukes teamfights." },
  sven: { key: "Blink Dagger", path: ["Power Treads", "Magic Wand", "Echo Sabre", "Black King Bar", "Blink Dagger", "Daedalus", "Satanic"], note: "God's Strength + Great Cleave one-shots clumps; Echo Sabre (no toggling) for tempo, then Blink + BKB to jump the backline." },
  "phantom-lancer": { key: "Diffusal Blade", path: ["Power Treads", "Magic Wand", "Diffusal Blade", "Manta Style", "Heart of Tarrasque", "Butterfly", "Eye of Skadi"], note: "Diffusal + Manta flood illusions; nearly impossible to focus down." },
  "naga-siren": { key: "Radiance", path: ["Power Treads", "Magic Wand", "Radiance", "Manta Style", "Heart of Tarrasque", "Butterfly", "Eye of Skadi"], note: "Song sets up fights; Radiance illusions farm the whole map." },
  morphling: { key: "Eye of Skadi", path: ["Power Treads", "Magic Wand", "Eye of Skadi", "Ethereal Blade", "Black King Bar", "Butterfly", "Satanic"], note: "Skadi + Ethereal combo bursts a target; Waveform/Morph make you slippery." },
  "anti-mage": { key: "Battle Fury", path: ["Power Treads", "Magic Wand", "Battle Fury", "Manta Style", "Abyssal Blade", "Black King Bar", "Butterfly"], note: "A sub-14-min Battlefury is mandatory this patch; Manta to dodge & farm." },
  "troll-warlord": { key: "Battle Fury", path: ["Power Treads", "Magic Wand", "Battle Fury", "Black King Bar", "Maelstrom", "Satanic", "Abyssal Blade"], note: "Bully the lane and snowball before you fall off late." },
  "monkey-king": { key: "Echo Sabre", path: ["Power Treads", "Magic Wand", "Echo Sabre", "Black King Bar", "Silver Edge", "Eye of Skadi", "Abyssal Blade"], note: "Boundless Strike + ring setups; Silver Edge for break + a jump." },
  clinkz: { key: "Maelstrom", path: ["Power Treads", "Magic Wand", "Maelstrom", "Black King Bar", "Eye of Skadi", "Daedalus", "Monkey King Bar"], note: "Burst squishies from stealth; Skadi keeps them in range." },
  riki: { key: "Diffusal Blade", path: ["Power Treads", "Magic Wand", "Diffusal Blade", "Manta Style", "Black King Bar", "Basher", "Abyssal Blade"], note: "Smoke + Diffusal to chase; build pickoffs that beat detection." },
  meepo: { key: "Blink Dagger", path: ["Power Treads", "Dragon Lance", "Blink Dagger", "Aghanim's Scepter", "Eye of Skadi", "Heart of Tarrasque"], note: "Net + Blink to gank; end the game before scaling carries come online." },
  alchemist: { key: "Radiance", path: ["Power Treads", "Radiance", "Black King Bar", "Assault Cuirass", "Abyssal Blade", "Heart of Tarrasque"], note: "Greevil's Greed funds a huge tempo lead — but weakened in 7.41c." },
  "lone-druid": { key: "Assault Cuirass", path: ["Power Treads (Bear)", "Vladmir's Offering", "Assault Cuirass", "Black King Bar", "Moon Shard", "Abyssal Blade"], note: "Bear-centric split-push; nerfed hard in 7.41c." },
  "templar-assassin": { key: "Desolator", path: ["Power Treads", "Magic Wand", "Desolator", "Blink Dagger", "Black King Bar", "Daedalus", "Butterfly"], note: "Psi Blades + Deso melt; Meld burst from the fog." },
};
const FALLBACK_BUILD = { key: "core farming item", path: ["Power Treads", "Magic Wand", "(farming item)", "Black King Bar", "(damage)", "(survivability)"], note: "Generic carry path — add a build entry for tighter advice." };

function lineupSignals(enemies) {
  const s = { magic: 0, phys: 0, tanky: 0, lockdown: 0, evasion: false, illuSummon: false, silence: false, invis: false, heal: 0 };
  enemies.forEach((e) => {
    if (has(e, "magic-burst") || has(e, "spell-reliant")) s.magic++;
    if (has(e, "physical-dps")) s.phys++;
    if (has(e, "tanky")) s.tanky++;
    if (has(e, "lockdown") || has(e, "aoe-disable")) s.lockdown++;
    if (has(e, "evasion")) s.evasion = true;
    if (has(e, "illusion") || has(e, "summon")) s.illuSummon = true;
    if (has(e, "silence")) s.silence = true;
    if (has(e, "invis")) s.invis = true;
    if (has(e, "heal")) s.heal++;
  });
  return s;
}
function situationalItems(hero, enemies) {
  const s = lineupSignals(enemies);
  const out = [];
  if (s.magic >= 2) out.push({ item: "Black King Bar", prio: 5, reason: `${s.magic} magic / spell threats — BKB buys a clean window` });
  else if (s.lockdown >= 2) out.push({ item: "Black King Bar", prio: 4.5, reason: `${s.lockdown} disables — BKB to act through their chain` });
  if (s.evasion) out.push({ item: "Monkey King Bar", prio: 4, reason: "enemy evasion — MKB restores true strike" });
  if (s.illuSummon) out.push({ item: ["phantom-assassin", "faceless-void", "wraith-king", "ursa", "troll-warlord", "anti-mage"].includes(hero.id) ? "Battle Fury" : "Mjollnir", prio: 3.5, reason: "illusions / summons — cleave & chain lightning clear them" });
  if (s.tanky >= 2) out.push({ item: "Silver Edge", prio: 3.2, reason: `${s.tanky} tanky cores — break their passive + burst` });
  if (s.phys >= 3) out.push({ item: "Assault Cuirass", prio: 3, reason: `${s.phys} physical cores — armor swings the fights` });
  if (s.heal >= 2) out.push({ item: "Eye of Skadi", prio: 2.8, reason: "heavy heal / lifesteal — Skadi slows & cuts their healing" });
  if (s.silence) out.push({ item: "Manta Style", prio: 2.5, reason: "enemy silences — Manta dispels them off you" });
  if (s.invis) out.push({ item: "Detection (Gem / Sentries)", prio: 2.3, reason: "invisible cores — hold detection; a Gem snowballs" });
  const seen = new Map();
  out.forEach((o) => { const p = seen.get(o.item); if (!p || o.prio > p.prio) seen.set(o.item, o); });
  return [...seen.values()].sort((a, b) => b.prio - a.prio).slice(0, 4);
}
function buildGuide(hero, enemies) {
  const base = CORE_BUILDS[hero.id] || FALLBACK_BUILD;
  return { ...base, situational: situationalItems(hero, enemies) };
}

/* ----------------------------------------------------------------
   UI
-----------------------------------------------------------------*/
function Portrait({ hero, size = 38 }) {
  const initials = hero.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="oracle-mono flex items-center justify-center rounded-full shrink-0 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34, color: "#0b0d10",
        background: `radial-gradient(circle at 30% 25%, ${ATTR_COLOR[hero.attr]}, ${ATTR_COLOR[hero.attr]}aa)`,
        boxShadow: `0 0 0 2px ${ATTR_COLOR[hero.attr]}55, inset 0 1px 2px rgba(255,255,255,.35)` }}>{initials}</div>
  );
}
function TierPill({ tier, small }) {
  if (!tier) return null;
  return <span className="oracle-mono font-bold rounded" style={{ fontSize: small ? 9 : 11, padding: small ? "1px 4px" : "2px 6px", color: "#0b0d10", background: TIER_COLOR[tier] }}>{tier}</span>;
}
function HeroPicker({ onPick, excludeIds, placeholder, accent }) {
  const [q, setQ] = useState("");
  const list = HEROES.filter((h) => !excludeIds.has(h.id) && h.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="rounded-lg p-2.5 mt-2" style={{ background: "rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.06)" }}>
      <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 mb-2" style={{ background: "rgba(0,0,0,.35)" }}>
        <Search size={13} color="#6b7280" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="bg-transparent outline-none fs11 w-full oracle-root" style={{ color: "#dfe3ea" }} />
        <span className="oracle-mono fs10 shrink-0" style={{ color: "#5d6470" }}>{list.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
        {list.map((h) => (
          <button key={h.id} onClick={() => onPick(h.id)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:brightness-125" style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${accent}22` }}>
            <Portrait hero={h} size={24} />
            <div className="min-w-0 flex-1">
              <div className="fs11 truncate flex items-center gap-1" style={{ color: "#dfe3ea" }}>{h.name} {META[h.id] && <TierPill tier={META[h.id].tier} small />}</div>
              <div className="oracle-mono fs10 truncate" style={{ color: "#5d6470" }}>{h.roles.join(" · ")}</div>
            </div>
          </button>
        ))}
        {list.length === 0 && <p className="col-span-2 fs11 italic py-3 text-center" style={{ color: "#566070" }}>no heroes match</p>}
      </div>
    </div>
  );
}
function PosSelect({ value, onChange, accent }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} className="oracle-mono fs10 rounded outline-none"
      style={{ color: value ? "#0b0d10" : accent, background: value ? accent : "rgba(0,0,0,.3)", border: `1px solid ${accent}66`, padding: "2px 3px" }}>
      <option value="" style={{ color: "#000" }}>pos?</option>
      {ROLES.map((r) => <option key={r} value={r} style={{ color: "#000" }}>{POS_NUM[r]} {r}</option>)}
    </select>
  );
}

export default function DraftOracle() {
  const [poolIds, setPoolIds] = useState(["juggernaut", "wraith-king", "spectre", "kez", "necrophos", "faceless-void", "drow-ranger", "phantom-assassin", "sniper", "lifestealer", "luna", "medusa", "slark", "sven"]);
  const [myRole, setMyRole] = useState("Carry");
  const [rank, setRank] = useState("Archon");
  const [team, setTeam] = useState([]);   // {id, pos}
  const [enemy, setEnemy] = useState([]); // {id, pos}
  const [boardTarget, setBoardTarget] = useState("ally");
  const [showPool, setShowPool] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const boardUsed = new Set([...team.map((x) => x.id), ...enemy.map((x) => x.id)]);
  const teamHeroes = team.map((x) => HERO_BY_ID[x.id]);
  const enemyHeroes = enemy.map((x) => HERO_BY_ID[x.id]);

  const addPool = (id) => { if (!poolIds.includes(id)) setPoolIds([...poolIds, id]); };
  const removePool = (id) => setPoolIds(poolIds.filter((x) => x !== id));
  const addBoard = (id) => {
    if (boardTarget === "ally") { if (team.length < 5) setTeam([...team, { id, pos: null }]); }
    else { if (enemy.length < 5) setEnemy([...enemy, { id, pos: null }]); }
  };
  const setBoard = (side, fn) => (side === "ally" ? setTeam : setEnemy)(fn(side === "ally" ? team : enemy));
  const setPos = (side, id, pos) => setBoard(side, (arr) => arr.map((x) => (x.id === id ? { ...x, pos } : x)));
  const removeB = (side, id) => setBoard(side, (arr) => arr.filter((x) => x.id !== id));

  const eligible = poolIds.map((id) => HERO_BY_ID[id]).filter(Boolean).filter((h) => h.roles.includes(myRole) && !boardUsed.has(h.id));
  const bracketFactor = bracketFactorFor(rank);
  const recs = useMemo(
    () => eligible.map((h) => ({ hero: h, ...scoreHero(h, teamHeroes, enemyHeroes, bracketFactor) })).sort((a, b) => b.total - a.total || a.hero.name.localeCompare(b.hero.name)),
    [poolIds, myRole, team, enemy, rank]
  );
  const contested = team.some((x) => x.pos === myRole);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Spectral:ital,wght@0,400;0,500;1,400&family=Space+Mono:wght@400;700&display=swap');
    .oracle-root{font-family:'Spectral',Georgia,serif;} .oracle-display{font-family:'Cinzel',serif;} .oracle-mono{font-family:'Space Mono',monospace;}
    .fs10{font-size:10px;line-height:1.3}.fs11{font-size:11px;line-height:1.35}
    @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .rise{animation:rise .4s cubic-bezier(.2,.7,.3,1) both}
    .oracle-root *::-webkit-scrollbar{width:7px}.oracle-root *::-webkit-scrollbar-thumb{background:#2a2f38;border-radius:9px}
    select.oracle-mono option{background:#15181e}
  `;
  const Card = ({ children }) => <section className="rounded-xl p-3.5 mb-4" style={{ background: "rgba(15,18,23,.65)", border: "1px solid rgba(255,255,255,.07)" }}>{children}</section>;

  return (
    <div className="oracle-root min-h-screen w-full px-4 py-6 sm:px-6" style={{ color: "#dfe3ea",
      background: "radial-gradient(ellipse 60% 80% at 0% 0%, rgba(116,177,63,.10), transparent 55%),radial-gradient(ellipse 60% 80% at 100% 100%, rgba(209,70,58,.12), transparent 55%),#0a0c0f" }}>
      <style>{styles}</style>
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 44, height: 44, background: "linear-gradient(135deg,#c79a45,#8a6a26)", boxShadow: "0 4px 16px rgba(199,154,69,.3)" }}><Swords size={24} color="#0b0d10" /></div>
          <div>
            <h1 className="oracle-display text-2xl sm:text-3xl tracking-wider" style={{ color: "#f0e6cf" }}>DRAFT ORACLE</h1>
            <p className="fs11 sm:text-sm" style={{ color: "#7d8593" }}>Picks from <span style={{ color: "#c79a45" }}>your hero pool</span> for <span style={{ color: "#c79a45" }}>your role</span> · weighted by 7.41c meta</p>
          </div>
        </header>

        {/* MY POOL */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="oracle-display fs11 uppercase tracking-widest" style={{ color: "#6b7280" }}>My role</span>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setMyRole(r)} className="oracle-display fs11 px-2.5 py-1.5 rounded-md tracking-wide"
                    style={{ color: myRole === r ? "#0b0d10" : "#aeb4be", background: myRole === r ? "#c79a45" : "rgba(255,255,255,.04)", border: "1px solid " + (myRole === r ? "#c79a45" : "rgba(255,255,255,.08)") }}>{POS_NUM[r]} {r}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowPool((s) => !s)} className="oracle-display fs11 px-3 py-1.5 rounded-md tracking-wide flex items-center gap-1" style={{ color: "#0b0d10", background: "#74b13f" }}><Plus size={13} /> Add hero</button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="oracle-display fs11 uppercase tracking-widest" style={{ color: "#6b7280" }}>My rank</span>
            <select value={rank} onChange={(e) => setRank(e.target.value)} className="oracle-mono fs11 rounded-md outline-none" style={{ color: "#0b0d10", background: "#c79a45", border: "1px solid #c79a45", padding: "3px 6px" }}>
              {RANKS.map((rk) => <option key={rk} value={rk} style={{ color: "#000", background: "#15181e" }}>{rk}</option>)}
            </select>
            <span className="fs10 italic" style={{ color: "#6b7280" }}>
              {bracketFactor === 1 ? "weighting forgiving, self-sufficient carries up" : bracketFactor === 0.5 ? "mild bracket adjustment" : "raw high-MMR meta"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {poolIds.map((id) => HERO_BY_ID[id]).filter(Boolean).map((h) => (
              <button key={h.id} onClick={() => removePool(h.id)} className="group flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1" style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.08)" }}>
                <Portrait hero={h} size={22} />
                <span className="fs11" style={{ color: "#dfe3ea" }}>{h.name}</span>
                {META[h.id] && <TierPill tier={META[h.id].tier} small />}
                <X size={12} className="opacity-30 group-hover:opacity-90" style={{ color: "#d1463a" }} />
              </button>
            ))}
            {poolIds.length === 0 && <p className="fs11 italic" style={{ color: "#566070" }}>your pool is empty — add the heroes you play</p>}
          </div>
          {showPool && <HeroPicker onPick={addPool} excludeIds={new Set(poolIds)} placeholder="add any hero to your pool…" accent="#74b13f" />}
        </Card>

        {/* DRAFT BOARD */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="oracle-display fs11 uppercase tracking-widest" style={{ color: "#6b7280" }}>Draft board — you set each hero's position</span>
            <div className="flex items-center gap-1.5">
              {[["ally", "My Team", "#74b13f"], ["enemy", "Enemy", "#d1463a"]].map(([v, label, c]) => (
                <button key={v} onClick={() => { setBoardTarget(v); setShowBoard(true); }} className="oracle-display fs11 px-3 py-1.5 rounded-md tracking-wide"
                  style={{ color: boardTarget === v ? "#0b0d10" : c, background: boardTarget === v ? c : "rgba(255,255,255,.04)", border: `1px solid ${c}${boardTarget === v ? "" : "55"}` }}>{label}</button>
              ))}
            </div>
          </div>
          {showBoard && <HeroPicker onPick={addBoard} excludeIds={boardUsed} placeholder={`add a hero to ${boardTarget === "ally" ? "your team" : "the enemy"}…`} accent={boardTarget === "ally" ? "#74b13f" : "#d1463a"} />}
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[["ally", team, "#74b13f", "Your Team"], ["enemy", enemy, "#d1463a", "Enemy"]].map(([side, arr, accent, label]) => (
              <div key={side} className="rounded-lg p-2.5" style={{ background: "rgba(18,21,27,.6)", border: `1px solid ${accent}44` }}>
                <div className="oracle-display fs11 uppercase tracking-widest mb-2" style={{ color: accent }}>{label} <span className="oracle-mono" style={{ color: "#5d6470" }}>{arr.length}/5</span></div>
                <div className="flex flex-col gap-1.5">
                  {arr.length === 0 && <p className="fs11 italic" style={{ color: "#566070" }}>none yet</p>}
                  {arr.map((it) => {
                    const h = HERO_BY_ID[it.id];
                    return (
                      <div key={it.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "rgba(0,0,0,.25)" }}>
                        <Portrait hero={h} size={24} />
                        <span className="fs11 flex-1 truncate" style={{ color: "#dfe3ea" }}>{h.name}</span>
                        <PosSelect value={it.pos} onChange={(p) => setPos(side, it.id, p)} accent={accent} />
                        <button onClick={() => removeB(side, it.id)}><X size={13} style={{ color: accent }} className="opacity-40 hover:opacity-90" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RECOMMENDATIONS */}
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles size={16} color="#c79a45" />
          <h2 className="oracle-display tracking-widest text-sm uppercase" style={{ color: "#f0e6cf" }}>Best {myRole} from your pool</h2>
          <span className="oracle-mono fs10 ml-auto" style={{ color: "#6b7280" }}>7.41c · {rank}</span>
        </div>
        {bracketFactor > 0 && (
          <div className="rounded-lg px-3 py-2 mb-2.5 fs11 flex items-start gap-2" style={{ background: "rgba(199,154,69,.1)", border: "1px solid rgba(199,154,69,.22)", color: "#d9bd86" }}>
            <Sparkles size={13} className="mt-0.5 shrink-0" /> Tuned for {rank}: forgiving, self-sufficient carries are weighted up; high-skill-ceiling heroes (Faceless Void, Kez) are weighted down. Switch to Divine/Immortal for the raw pro meta.
          </div>
        )}
        {contested && (
          <div className="rounded-lg px-3 py-2 mb-2.5 fs11 flex items-center gap-2" style={{ background: "rgba(209,70,58,.12)", border: "1px solid rgba(209,70,58,.25)", color: "#e09a92" }}>
            <ShieldAlert size={13} /> A teammate is also marked {myRole} — your core role looks contested.
          </div>
        )}
        {recs.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "rgba(15,18,23,.5)", border: "1px dashed rgba(255,255,255,.1)" }}>
            <Crosshair size={26} color="#3a4049" className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#7d8593" }}>No heroes in your pool can play {myRole}. Add some with “Add hero,” or switch your role.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recs.map((r, i) => {
              const open = expandedId === r.hero.id || (expandedId === null && i === 0);
              const g = open ? buildGuide(r.hero, enemyHeroes) : null;
              return (
              <div key={r.hero.id} className="rise rounded-xl p-3" style={{ animationDelay: `${i * 55}ms`, background: "rgba(17,20,26,.8)", border: open ? "1px solid rgba(199,154,69,.4)" : "1px solid rgba(255,255,255,.08)" }}>
                <button onClick={() => setExpandedId(open ? "__none__" : r.hero.id)} className="w-full flex items-center gap-3 text-left">
                  <span className="oracle-display text-lg w-5 text-center" style={{ color: i === 0 ? "#c79a45" : "#4b5563" }}>{i + 1}</span>
                  <Portrait hero={r.hero} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium truncate" style={{ color: "#f0e6cf" }}>{r.hero.name}</span>
                      {r.meta && <TierPill tier={r.meta.tier} />}
                      {i === 0 && <Star size={13} color="#c79a45" fill="#c79a45" />}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: "rgba(255,255,255,.07)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, ((r.total + 3) / 14) * 100))}%`, background: r.total >= 0 ? "linear-gradient(90deg,#3f8fd1,#74b13f)" : "linear-gradient(90deg,#7a3b35,#d1463a)" }} />
                    </div>
                  </div>
                  <span className="oracle-mono text-sm font-bold" style={{ color: r.total >= 0 ? "#74b13f" : "#d1463a" }}>{r.total >= 0 ? "+" : ""}{r.total.toFixed(1)}</span>
                  <ChevronDown size={16} color="#6b7280" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>
                <div className="flex flex-wrap gap-1.5 pl-8 mt-2">
                  {r.reasons.slice(0, 5).map((rs, j) => (
                    <span key={j} className="fs11 px-2 py-0.5 rounded-full" style={{ color: rs.w >= 0 ? "#a9d488" : "#e09a92", background: rs.w >= 0 ? "rgba(116,177,63,.12)" : "rgba(209,70,58,.12)", border: `1px solid ${rs.w >= 0 ? "rgba(116,177,63,.25)" : "rgba(209,70,58,.25)"}` }}>{rs.label}</span>
                  ))}
                  {r.reasons.length === 0 && <span className="fs11 italic" style={{ color: "#566070" }}>solid neutral pick</span>}
                </div>

                {open && g && (
                  <div className="mt-3 pt-3 pl-8" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Coins size={12} color="#c79a45" />
                      <span className="oracle-display fs10 uppercase tracking-widest" style={{ color: "#8a7a55" }}>Core build path</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      {g.path.map((it, k) => (
                        <React.Fragment key={k}>
                          <span className="fs11 rounded-md px-2 py-0.5 inline-flex items-center gap-1" style={it === g.key
                            ? { color: "#0b0d10", background: "#c79a45", fontWeight: 700 }
                            : { color: "#cfd4dc", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                            {it === g.key && <Star size={10} fill="#0b0d10" color="#0b0d10" />}{it}
                          </span>
                          {k < g.path.length - 1 && <span style={{ color: "#4b5563" }}>›</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="fs11 italic mb-3" style={{ color: "#8b93a1" }}>{g.note}</p>
                    {bracketFactor === 1 && (
                      <p className="fs11 italic mb-3" style={{ color: "#c79a45" }}>{rank} tip: don't skip BKB for greedy damage — pubs at this rank will jump you. Farm efficiently and buy your defensive item on time.</p>
                    )}

                    <span className="oracle-display fs10 uppercase tracking-widest" style={{ color: "#8a7a55" }}>Tune vs this lineup</span>
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      {g.situational.length === 0 ? (
                        <p className="fs11 italic" style={{ color: "#566070" }}>Add the enemy lineup above to get tailored timing (BKB vs magic, MKB vs evasion, cleave vs illusions…).</p>
                      ) : g.situational.map((it, k) => (
                        <div key={k} className="flex items-start gap-2 rounded-md px-2 py-1.5" style={{ background: "rgba(199,154,69,.08)", border: "1px solid rgba(199,154,69,.2)" }}>
                          <span className="fs11 font-bold shrink-0" style={{ color: "#e0bf7a" }}>{it.item}</span>
                          <span className="fs11" style={{ color: "#9aa1ad" }}>— {it.reason}</span>
                        </div>
                      ))}
                    </div>
                    <a href={`https://www.dotabuff.com/heroes/${dotabuffSlug(r.hero.name)}/guides`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 fs10 mt-2.5 oracle-mono" style={{ color: "#6b7280" }}>
                      Build basis: 7.41c pub &amp; pro trends · full guide ↗
                    </a>
                  </div>
                )}
              </div>
            );})}
          </div>
        )}

        <div className="flex items-start gap-2 mt-4 fs11" style={{ color: "#5d6470" }}>
          <ShieldAlert size={13} className="mt-0.5 shrink-0" />
          <p className="oracle-root italic">Suggests only heroes from your pool that can play {myRole}, ranked by 7.41c meta tier plus matchups vs the enemy board and synergy with your team. Meta read is hand-tuned from current DotaBuff / Dota2ProTracker trends and will drift as Valve patches — re-check before relying on it in ranked.</p>
        </div>
      </div>
    </div>
  );
}

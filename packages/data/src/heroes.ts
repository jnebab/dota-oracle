import type { Attr, Hero, Role } from "./types";

/**
 * Full Dota 2 hero pool (through Largo, 7.41c), ported from the prototype.
 * Format: "Name|attr|roles|tags" where roles are
 * c=Carry m=Mid o=Offlane s=Support h=Hard Support.
 */
export const ROLE_MAP: Record<string, Role> = {
  c: "Carry",
  m: "Mid",
  o: "Offlane",
  s: "Support",
  h: "Hard Support",
};

export const ROLES: Role[] = ["Carry", "Mid", "Offlane", "Support", "Hard Support"];

export const POS_NUM: Record<Role, string> = {
  Carry: "1",
  Mid: "2",
  Offlane: "3",
  Support: "4",
  "Hard Support": "5",
};

export const slug = (n: string): string =>
  n
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const dotabuffSlug = (n: string): string =>
  n
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const RAW: string[] = [
  "Abaddon|uni|s,o,c|tanky",
  "Alchemist|str|c,m,o|tanky,physical-dps",
  "Ancient Apparition|int|h,s|spell-reliant,squishy,immobile,aoe-control",
  "Anti-Mage|agi|c|mobility,mana-burn,physical-dps,passive-reliant",
  "Arc Warden|agi|c,m|magic-burst,physical-dps,squishy,mana-dependent",
  "Axe|str|o|tanky,lockdown,aoe-disable,aoe-control",
  "Bane|uni|h,s|lockdown,spell-reliant,squishy,immobile",
  "Batrider|uni|o,m,s|lockdown,spell-reliant,mobility,aoe-control",
  "Beastmaster|uni|o|tanky,lockdown,summon",
  "Bloodseeker|agi|c,o,m|physical-dps,silence,mobility,passive-reliant",
  "Bounty Hunter|agi|s|mobility,physical-dps",
  "Brewmaster|str|o,c|tanky,lockdown,evasion",
  "Bristleback|str|o|tanky,physical-dps,passive-reliant",
  "Broodmother|agi|m,o,c|physical-dps,summon,mobility",
  "Centaur Warrunner|str|o|tanky,aoe-disable,aoe-control",
  "Chaos Knight|str|c,o|illusion,physical-dps,lockdown",
  "Chen|uni|s,h|summon,squishy,immobile",
  "Clinkz|agi|c,m|physical-dps,mobility,squishy",
  "Clockwerk|uni|o,s|lockdown,tanky,mobility",
  "Crystal Maiden|int|h|squishy,immobile,aoe-control,lockdown,mana-aura,spell-reliant",
  "Dark Seer|uni|o|aoe-control,tanky",
  "Dark Willow|uni|s,h|lockdown,magic-burst,spell-reliant,squishy",
  "Dawnbreaker|str|o,s,c|tanky,aoe-disable,mobility",
  "Dazzle|int|h,s|spell-reliant,squishy,immobile",
  "Death Prophet|int|m,o|magic-burst,silence,spell-reliant,tanky,summon",
  "Disruptor|int|h,s|aoe-control,lockdown,silence,spell-reliant,squishy,immobile",
  "Doom|uni|o,m|lockdown,silence,break,tanky",
  "Dragon Knight|str|m,o,c|tanky,lockdown,physical-dps",
  "Drow Ranger|agi|c|physical-dps,squishy,immobile,passive-reliant",
  "Earth Spirit|uni|s|lockdown,mobility,aoe-control",
  "Earthshaker|str|s|aoe-disable,aoe-control,magic-burst,lockdown",
  "Elder Titan|uni|o,s|aoe-disable,aoe-control,tanky",
  "Ember Spirit|agi|m,c|mobility,physical-dps,magic-burst,squishy",
  "Enchantress|uni|s,o,c|summon,physical-dps,squishy",
  "Enigma|uni|o,s|summon,aoe-control,aoe-disable",
  "Faceless Void|agi|c|aoe-control,aoe-disable,physical-dps,lockdown,passive-reliant",
  "Grimstroke|int|h,s|lockdown,magic-burst,spell-reliant,silence,squishy,immobile",
  "Gyrocopter|agi|c,s|physical-dps,magic-burst,aoe-disable",
  "Hoodwink|agi|s,h|mobility,magic-burst,spell-reliant,squishy",
  "Huskar|str|c,m,o|physical-dps,tanky,passive-reliant",
  "Invoker|uni|m|spell-reliant,magic-burst,aoe-control,squishy,mana-dependent",
  "Io|uni|s,h|mobility",
  "Jakiro|int|h,s|aoe-control,magic-burst,spell-reliant,immobile,squishy",
  "Juggernaut|agi|c|physical-dps,mobility",
  "Keeper of the Light|int|h,m|magic-burst,spell-reliant,squishy,immobile,mana-aura,mana-dependent",
  "Kez|agi|c,m|physical-dps,mobility",
  "Kunkka|str|m,o,c,s|aoe-control,aoe-disable,physical-dps,tanky",
  "Largo|uni|s,h|aoe-control,lockdown",
  "Legion Commander|str|o,c|physical-dps,lockdown,tanky",
  "Leshrac|uni|m,o|magic-burst,spell-reliant,aoe-control,squishy,immobile",
  "Lich|int|h|magic-burst,aoe-control,spell-reliant,squishy,immobile",
  "Lifestealer|str|c|physical-dps,tanky,mobility,passive-reliant",
  "Lina|uni|m|magic-burst,spell-reliant,squishy,immobile,lockdown",
  "Lion|int|h|lockdown,magic-burst,spell-reliant,squishy,immobile,mana-burn",
  "Lone Druid|uni|c,o|summon,physical-dps,tanky",
  "Luna|agi|c|physical-dps,aoe-disable,squishy",
  "Lycan|uni|o,c,m|summon,physical-dps,mobility,tanky",
  "Magnus|uni|o,s|aoe-control,aoe-disable",
  "Marci|uni|s,c,o|physical-dps,mobility,lockdown,tanky",
  "Mars|str|o|tanky,aoe-control,lockdown,aoe-disable",
  "Medusa|agi|c|physical-dps,mana-dependent,tanky",
  "Meepo|agi|c,m|physical-dps,summon,mobility",
  "Mirana|uni|s,m,c|lockdown,physical-dps,mobility,aoe-control",
  "Monkey King|agi|c,o,m|physical-dps,mobility,aoe-disable",
  "Morphling|agi|c,m|physical-dps,mobility",
  "Muerta|int|c,m,s|physical-dps,magic-burst,spell-reliant",
  "Naga Siren|agi|c,o,s|illusion,physical-dps,aoe-control,aoe-disable",
  "Nature's Prophet|int|m,o,c,s|summon,mobility",
  "Necrophos|int|c,m,o|magic-burst,tanky,spell-reliant",
  "Night Stalker|str|o,c|physical-dps,silence,tanky",
  "Nyx Assassin|agi|s|mobility,lockdown,mana-burn,spell-reflect",
  "Ogre Magi|int|h,s|lockdown,magic-burst,tanky,spell-reliant",
  "Omniknight|str|s,h,o|tanky",
  "Oracle|int|h,s|spell-reliant,squishy,immobile",
  "Outworld Destroyer|int|m,c|magic-burst,aoe-disable,mana-dependent",
  "Pangolier|uni|o,m,c,s|mobility,aoe-control,physical-dps,tanky",
  "Phantom Assassin|agi|c|physical-dps,mobility,evasion,passive-reliant",
  "Phantom Lancer|agi|c|illusion,physical-dps,mobility",
  "Phoenix|uni|o,s|aoe-control,tanky,magic-burst",
  "Primal Beast|str|o,m,s|tanky,lockdown,aoe-disable,mobility",
  "Puck|int|m|mobility,magic-burst,spell-reliant,aoe-control,squishy",
  "Pudge|str|o,s,m|lockdown,tanky,magic-burst",
  "Pugna|int|h,m|magic-burst,spell-reliant,squishy",
  "Queen of Pain|int|m|mobility,magic-burst,spell-reliant,squishy",
  "Razor|agi|m,o,c|physical-dps,aoe-control",
  "Riki|agi|c,s|physical-dps,mobility,silence",
  "Ringmaster|uni|s,h|lockdown,aoe-control,spell-reliant",
  "Rubick|int|h,s|lockdown,spell-reliant,squishy,immobile,aoe-control",
  "Sand King|uni|o,s,m|aoe-control,aoe-disable,mobility,tanky",
  "Shadow Demon|uni|h,s|lockdown,spell-reliant,squishy,aoe-control",
  "Shadow Fiend|agi|c,m|physical-dps,magic-burst,squishy,immobile",
  "Shadow Shaman|int|h,s|lockdown,summon,spell-reliant,squishy,immobile",
  "Silencer|int|s,h,m|silence,spell-reliant,squishy,immobile,magic-burst",
  "Skywrath Mage|int|h,s|magic-burst,spell-reliant,squishy,immobile,silence",
  "Slardar|str|o,c,s|physical-dps,lockdown,tanky",
  "Slark|agi|c,m|physical-dps,mobility",
  "Snapfire|uni|s,h,m|aoe-control,magic-burst,lockdown",
  "Sniper|agi|c|physical-dps,squishy,immobile",
  "Spectre|agi|c|tanky,physical-dps,passive-reliant",
  "Spirit Breaker|str|s|mobility,lockdown,tanky",
  "Storm Spirit|int|m|mobility,magic-burst,spell-reliant,mana-dependent,squishy",
  "Sven|str|c|physical-dps,aoe-disable,mobility,aoe-control",
  "Techies|uni|s,m,o|magic-burst,aoe-control,spell-reliant",
  "Templar Assassin|agi|m,c|physical-dps,magic-burst,mobility,squishy",
  "Terrorblade|agi|c,m|illusion,physical-dps",
  "Tidehunter|str|o|tanky,aoe-control,aoe-disable",
  "Timbersaw|str|o,m|tanky,magic-burst,mobility,spell-reliant",
  "Tinker|int|m|spell-reliant,magic-burst,immobile,squishy,mana-dependent",
  "Tiny|str|m,o,c,s|lockdown,physical-dps,aoe-disable,tanky",
  "Treant Protector|str|h,o,s|lockdown,tanky,spell-reliant,aoe-disable,aoe-control",
  "Troll Warlord|agi|c,o|physical-dps,lockdown,evasion",
  "Tusk|str|s|mobility,lockdown",
  "Underlord|str|o|tanky,aoe-control",
  "Undying|str|o,s|tanky,aoe-control,summon",
  "Ursa|agi|c,o|physical-dps,passive-reliant",
  "Vengeful Spirit|uni|s,h|lockdown,squishy",
  "Venomancer|uni|o,s,h|summon,aoe-control,spell-reliant,squishy",
  "Viper|agi|m,o,c|physical-dps,magic-burst,tanky",
  "Visage|int|o,s,m|summon,magic-burst",
  "Void Spirit|uni|m,c|mobility,magic-burst,aoe-control",
  "Warlock|uni|h,s|summon,aoe-control,spell-reliant",
  "Weaver|agi|c,m,o,s|physical-dps,mobility,squishy,passive-reliant",
  "Windranger|uni|m,o,s,c|lockdown,physical-dps,magic-burst,squishy,evasion",
  "Winter Wyvern|int|h,s|aoe-control,spell-reliant,squishy,immobile",
  "Witch Doctor|int|h|magic-burst,aoe-control,squishy,immobile,spell-reliant",
  "Wraith King|str|c,o,s|physical-dps,tanky,lockdown",
  "Zeus|int|m|magic-burst,spell-reliant,squishy,immobile,aoe-control",
];

/** Extra tags consumed only by the item engine (they don't affect counter scoring). */
export const EXTRA_TAGS: Record<string, string[]> = {
  riki: ["invis"],
  clinkz: ["invis"],
  "bounty-hunter": ["invis"],
  mirana: ["invis"],
  slark: ["invis"],
  weaver: ["invis"],
  "sand-king": ["invis"],
  broodmother: ["invis"],
  "nyx-assassin": ["invis"],
  "wraith-king": ["heal"],
  necrophos: ["heal"],
  huskar: ["heal"],
  abaddon: ["heal"],
  dazzle: ["heal"],
  omniknight: ["heal"],
  alchemist: ["heal"],
  lifestealer: ["heal"],
  undying: ["heal"],
  warlock: ["heal"],
  "treant-protector": ["heal"],
  dawnbreaker: ["heal"],
};

export const HEROES: Hero[] = RAW.map((line) => {
  const [name, attr, roles, tags] = line.split("|") as [string, Attr, string, string | undefined];
  const id = slug(name);
  return {
    id,
    name,
    attr,
    roles: roles.split(",").map((r) => ROLE_MAP[r] as Role),
    tags: [...(tags ? tags.split(",") : []), ...(EXTRA_TAGS[id] ?? [])],
  };
}).sort((a, b) => a.name.localeCompare(b.name));

export const HERO_BY_ID: Record<string, Hero> = Object.fromEntries(HEROES.map((h) => [h.id, h]));

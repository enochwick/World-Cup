import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import {
  Trophy, Clock, MapPin, Star, X, ChevronRight, Flame, Shield,
  Target, Users, TrendingUp, Calendar, Zap, Info, Eye, MousePointerClick,
  CircleDot, AlertTriangle, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ============================================================================
   DATA — compiled from live sources on July 2, 2026 (NBC, CBS, FOX, FIFA.com).
   Tournament state: group stage complete, Round of 32 in progress.
   Uncertain figures are flagged with `unverified: true` and shown with a ※.
============================================================================ */

const DATA_AS_OF = "July 2, 2026";

const TEAMS = {
  MEX: { name: "Mexico", flag: "🇲🇽", stars: ["Raúl Rangel (GK)", "Edson Álvarez", "Santiago Giménez"] },
  RSA: { name: "South Africa", flag: "🇿🇦", stars: ["Ronwen Williams (GK)"] },
  KOR: { name: "South Korea", flag: "🇰🇷", stars: ["Son Heung-min", "Lee Kang-in"] },
  CZE: { name: "Czechia", flag: "🇨🇿", stars: ["Patrik Schick"] },
  SUI: { name: "Switzerland", flag: "🇨🇭", stars: ["Johan Manzambi", "Granit Xhaka", "Breel Embolo"] },
  CAN: { name: "Canada", flag: "🇨🇦", stars: ["Alphonso Davies", "Jonathan David", "Stephen Eustáquio"] },
  BIH: { name: "Bosnia & Herzegovina", flag: "🇧🇦", stars: ["Edin Džeko"] },
  QAT: { name: "Qatar", flag: "🇶🇦", stars: ["Akram Afif"] },
  BRA: { name: "Brazil", flag: "🇧🇷", stars: ["Vinícius Júnior", "Matheus Cunha", "Bruno Guimarães"] },
  MAR: { name: "Morocco", flag: "🇲🇦", stars: ["Achraf Hakimi", "Ismael Saibari", "Brahim Díaz"] },
  SCO: { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", stars: ["Scott McTominay", "Andy Robertson"] },
  HAI: { name: "Haiti", flag: "🇭🇹", stars: [] },
  USA: { name: "United States", flag: "🇺🇸", stars: ["Christian Pulisic", "Weston McKennie", "Matt Turner (GK)"] },
  AUS: { name: "Australia", flag: "🇦🇺", stars: ["Jackson Irvine", "Mathew Ryan (GK)"] },
  PAR: { name: "Paraguay", flag: "🇵🇾", stars: ["Julio Enciso", "Miguel Almirón", "Gustavo Gómez"] },
  TUR: { name: "Türkiye", flag: "🇹🇷", stars: ["Arda Güler", "Hakan Çalhanoğlu"] },
  GER: { name: "Germany", flag: "🇩🇪", stars: ["Kai Havertz", "Deniz Undav", "Jamal Musiala", "Florian Wirtz"] },
  CIV: { name: "Ivory Coast", flag: "🇨🇮", stars: ["Franck Kessié", "Simon Adingra"] },
  ECU: { name: "Ecuador", flag: "🇪🇨", stars: ["Moisés Caicedo", "Kendry Páez"] },
  CUW: { name: "Curaçao", flag: "🇨🇼", stars: ["Eloy Room (GK)"] },
  NED: { name: "Netherlands", flag: "🇳🇱", stars: ["Cody Gakpo", "Brian Brobbey", "Virgil van Dijk"] },
  JPN: { name: "Japan", flag: "🇯🇵", stars: ["Takefusa Kubo", "Kaoru Mitoma"] },
  SWE: { name: "Sweden", flag: "🇸🇪", stars: ["Alexander Isak", "Viktor Gyökeres"] },
  TUN: { name: "Tunisia", flag: "🇹🇳", stars: [] },
  BEL: { name: "Belgium", flag: "🇧🇪", stars: ["Kevin De Bruyne", "Jérémy Doku", "Romelu Lukaku"] },
  EGY: { name: "Egypt", flag: "🇪🇬", stars: ["Mohamed Salah", "Omar Marmoush"] },
  IRN: { name: "Iran", flag: "🇮🇷", stars: ["Mehdi Taremi"] },
  NZL: { name: "New Zealand", flag: "🇳🇿", stars: ["Chris Wood"] },
  ESP: { name: "Spain", flag: "🇪🇸", stars: ["Lamine Yamal", "Pedri", "Unai Simón (GK)"] },
  CPV: { name: "Cape Verde", flag: "🇨🇻", stars: ["Ryan Mendes", "Logan Costa"] },
  URU: { name: "Uruguay", flag: "🇺🇾", stars: ["Federico Valverde", "Darwin Núñez"] },
  KSA: { name: "Saudi Arabia", flag: "🇸🇦", stars: ["Salem Al-Dawsari"] },
  FRA: { name: "France", flag: "🇫🇷", stars: ["Kylian Mbappé", "Ousmane Dembélé", "Michael Olise"] },
  NOR: { name: "Norway", flag: "🇳🇴", stars: ["Erling Haaland", "Martin Ødegaard", "Alexander Sørloth"] },
  SEN: { name: "Senegal", flag: "🇸🇳", stars: ["Ismaïla Sarr", "Sadio Mané"] },
  IRQ: { name: "Iraq", flag: "🇮🇶", stars: [] },
  ARG: { name: "Argentina", flag: "🇦🇷", stars: ["Lionel Messi", "Julián Álvarez", "Lautaro Martínez"] },
  AUT: { name: "Austria", flag: "🇦🇹", stars: ["David Alaba", "Marcel Sabitzer", "Christoph Baumgartner"] },
  ALG: { name: "Algeria", flag: "🇩🇿", stars: ["Riyad Mahrez", "Amine Gouiri"] },
  JOR: { name: "Jordan", flag: "🇯🇴", stars: ["Musa Al-Taamari"] },
  COL: { name: "Colombia", flag: "🇨🇴", stars: ["Luis Díaz", "James Rodríguez", "Jhon Durán"] },
  POR: { name: "Portugal", flag: "🇵🇹", stars: ["Cristiano Ronaldo", "Bruno Fernandes", "Rafael Leão"] },
  COD: { name: "DR Congo", flag: "🇨🇩", stars: ["Yoane Wissa", "Cédric Bakambu"] },
  UZB: { name: "Uzbekistan", flag: "🇺🇿", stars: ["Abdukodir Khusanov"] },
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stars: ["Harry Kane", "Jude Bellingham", "Bukayo Saka"] },
  CRO: { name: "Croatia", flag: "🇭🇷", stars: ["Luka Modrić", "Joško Gvardiol", "Andrej Kramarić"] },
  GHA: { name: "Ghana", flag: "🇬🇭", stars: ["Mohammed Kudus", "Thomas Partey", "Antoine Semenyo"] },
  PAN: { name: "Panama", flag: "🇵🇦", stars: ["Adalberto Carrasquilla"] },
};

// status: "W"=won group, "RU"=runner-up, "T3"=qualified as best 3rd, "OUT"=eliminated in groups
const GROUPS = [
  { id: "A", rows: [
    { t: "MEX", p: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, pts: 9, st: "W" },
    { t: "RSA", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 3, pts: 4, st: "RU" },
    { t: "KOR", p: 3, w: 1, d: 0, l: 2, gf: 2, ga: 3, pts: 3, st: "OUT" },
    { t: "CZE", p: 3, w: 0, d: 1, l: 2, gf: 2, ga: 6, pts: 1, st: "OUT" },
  ]},
  { id: "B", rows: [
    { t: "SUI", p: 3, w: 2, d: 1, l: 0, gf: 7, ga: 1, pts: 7, st: "W" },
    { t: "CAN", p: 3, w: 1, d: 1, l: 1, gf: 5, ga: 2, pts: 4, st: "RU" },
    { t: "BIH", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 5, pts: 4, st: "T3" },
    { t: "QAT", p: 3, w: 0, d: 1, l: 2, gf: 1, ga: 7, pts: 1, st: "OUT" },
  ]},
  { id: "C", rows: [
    { t: "BRA", p: 3, w: 2, d: 1, l: 0, gf: 7, ga: 1, pts: 7, st: "W" },
    { t: "MAR", p: 3, w: 2, d: 1, l: 0, gf: 6, ga: 3, pts: 7, st: "RU" },
    { t: "SCO", p: 3, w: 1, d: 0, l: 2, gf: 1, ga: 4, pts: 3, st: "OUT" },
    { t: "HAI", p: 3, w: 0, d: 0, l: 3, gf: 2, ga: 8, pts: 0, st: "OUT" },
  ]},
  { id: "D", rows: [
    { t: "USA", p: 3, w: 2, d: 0, l: 1, gf: 8, ga: 4, pts: 6, st: "W" },
    { t: "AUS", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 2, pts: 4, st: "RU" },
    { t: "PAR", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 4, pts: 4, st: "T3" },
    { t: "TUR", p: 3, w: 1, d: 0, l: 2, gf: 3, ga: 5, pts: 3, st: "OUT" },
  ]},
  { id: "E", rows: [
    { t: "GER", p: 3, w: 2, d: 0, l: 1, gf: 10, ga: 2, pts: 6, st: "W" },
    { t: "CIV", p: 3, w: 2, d: 0, l: 1, gf: 4, ga: 2, pts: 6, st: "RU" },
    { t: "ECU", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 2, pts: 4, st: "T3" },
    { t: "CUW", p: 3, w: 0, d: 1, l: 2, gf: 1, ga: 9, pts: 1, st: "OUT" },
  ]},
  { id: "F", rows: [
    { t: "NED", p: 3, w: 2, d: 1, l: 0, gf: 10, ga: 4, pts: 7, st: "W" },
    { t: "JPN", p: 3, w: 1, d: 2, l: 0, gf: 7, ga: 3, pts: 5, st: "RU" },
    { t: "SWE", p: 3, w: 1, d: 1, l: 1, gf: 7, ga: 7, pts: 4, st: "T3" },
    { t: "TUN", p: 3, w: 0, d: 0, l: 3, gf: 2, ga: 12, pts: 0, st: "OUT" },
  ]},
  { id: "G", rows: [
    { t: "BEL", p: 3, w: 1, d: 2, l: 0, gf: 6, ga: 2, pts: 5, st: "W" },
    { t: "EGY", p: 3, w: 1, d: 2, l: 0, gf: 5, ga: 3, pts: 5, st: "RU" },
    { t: "IRN", p: 3, w: 0, d: 3, l: 0, gf: 3, ga: 3, pts: 3, st: "OUT" },
    { t: "NZL", p: 3, w: 0, d: 1, l: 2, gf: 4, ga: 10, pts: 1, st: "OUT" },
  ]},
  { id: "H", rows: [
    { t: "ESP", p: 3, w: 2, d: 1, l: 0, gf: 5, ga: 0, pts: 7, st: "W" },
    { t: "CPV", p: 3, w: 0, d: 3, l: 0, gf: 3, ga: 3, pts: 3, st: "RU" },
    { t: "URU", p: 3, w: 0, d: 2, l: 1, gf: 3, ga: 4, pts: 2, st: "OUT" },
    { t: "KSA", p: 3, w: 0, d: 2, l: 1, gf: 1, ga: 5, pts: 2, st: "OUT" },
  ]},
  { id: "I", rows: [
    { t: "FRA", p: 3, w: 3, d: 0, l: 0, gf: 10, ga: 2, pts: 9, st: "W" },
    { t: "NOR", p: 3, w: 2, d: 0, l: 1, gf: 8, ga: 7, pts: 6, st: "RU" },
    { t: "SEN", p: 3, w: 1, d: 0, l: 2, gf: 8, ga: 6, pts: 3, st: "T3" },
    { t: "IRQ", p: 3, w: 0, d: 0, l: 3, gf: 1, ga: 12, pts: 0, st: "OUT" },
  ]},
  { id: "J", rows: [
    { t: "ARG", p: 3, w: 3, d: 0, l: 0, gf: 8, ga: 1, pts: 9, st: "W" },
    { t: "AUT", p: 3, w: 1, d: 1, l: 1, gf: 6, ga: 6, pts: 4, st: "RU" },
    { t: "ALG", p: 3, w: 1, d: 1, l: 1, gf: 5, ga: 7, pts: 4, st: "T3" },
    { t: "JOR", p: 3, w: 0, d: 0, l: 3, gf: 2, ga: 5, pts: 0, st: "OUT" },
  ]},
  { id: "K", rows: [
    { t: "COL", p: 3, w: 2, d: 1, l: 0, gf: 4, ga: 1, pts: 7, st: "W" },
    { t: "POR", p: 3, w: 1, d: 2, l: 0, gf: 6, ga: 1, pts: 5, st: "RU" },
    { t: "COD", p: 3, w: 1, d: 1, l: 1, gf: 4, ga: 3, pts: 4, st: "T3" },
    { t: "UZB", p: 3, w: 0, d: 0, l: 3, gf: 2, ga: 11, pts: 0, st: "OUT" },
  ]},
  { id: "L", rows: [
    { t: "ENG", p: 3, w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7, st: "W" },
    { t: "CRO", p: 3, w: 2, d: 0, l: 1, gf: 5, ga: 5, pts: 6, st: "RU" },
    { t: "GHA", p: 3, w: 1, d: 1, l: 1, gf: 2, ga: 2, pts: 4, st: "T3" },
    { t: "PAN", p: 3, w: 0, d: 0, l: 3, gf: 0, ga: 4, pts: 0, st: "OUT" },
  ]},
];

// Knockout matches. kickoff = UTC ISO. hs/as = score, pens = shootout result.
const R32 = [
  { id: "m73", home: "RSA", away: "CAN", hs: 0, as: 1, winner: "CAN", kickoff: "2026-06-28T19:00:00Z", venue: "SoFi Stadium, Los Angeles" },
  { id: "m74", home: "BRA", away: "JPN", hs: 2, as: 1, winner: "BRA", kickoff: "2026-06-29T16:00:00Z", venue: "NRG Stadium, Houston" },
  { id: "m79", home: "GER", away: "PAR", hs: 1, as: 1, pens: "3–4", winner: "PAR", kickoff: "2026-06-29T20:30:00Z", venue: "Gillette Stadium, Boston" },
  { id: "m80", home: "NED", away: "MAR", hs: 1, as: 1, pens: "2–3", winner: "MAR", kickoff: "2026-06-30T00:00:00Z", venue: "Estadio BBVA, Monterrey" },
  { id: "m77", home: "CIV", away: "NOR", hs: 1, as: 2, winner: "NOR", kickoff: "2026-06-30T16:00:00Z", venue: "AT&T Stadium, Dallas" },
  { id: "m81", home: "FRA", away: "SWE", hs: 3, as: 0, winner: "FRA", kickoff: "2026-06-30T21:00:00Z", venue: null },
  { id: "m75", home: "MEX", away: "ECU", hs: 2, as: 0, winner: "MEX", kickoff: "2026-07-01T00:00:00Z", venue: null },
  { id: "m76", home: "ENG", away: "COD", hs: 2, as: 1, winner: "ENG", kickoff: "2026-07-01T16:00:00Z", venue: null },
  { id: "m78", home: "BEL", away: "SEN", hs: 3, as: 2, winner: "BEL", kickoff: "2026-07-01T20:00:00Z", venue: null },
  { id: "m82", home: "USA", away: "BIH", hs: 2, as: 0, winner: "USA", kickoff: "2026-07-02T00:00:00Z", venue: null },
  { id: "m83", home: "ESP", away: "AUT", kickoff: "2026-07-02T19:00:00Z", venue: "SoFi Stadium, Los Angeles" },
  { id: "m84", home: "POR", away: "CRO", kickoff: "2026-07-02T23:00:00Z", venue: "BMO Field, Toronto" },
  { id: "m85", home: "SUI", away: "ALG", kickoff: "2026-07-03T03:00:00Z", venue: "BC Place, Vancouver" },
  { id: "m86", home: "AUS", away: "EGY", kickoff: "2026-07-03T18:00:00Z", venue: "AT&T Stadium, Dallas" },
  { id: "m87", home: "ARG", away: "CPV", kickoff: "2026-07-03T22:00:00Z", venue: "Hard Rock Stadium, Miami" },
  { id: "m88", home: "COL", away: "GHA", kickoff: "2026-07-04T02:00:00Z", venue: null, timeTBC: true },
];

// feeds: [matchId, matchId] — winners of those matches meet here.
const R16 = [
  { id: "r16a", feeds: ["m73", "m80"], kickoff: "2026-07-04T17:00:00Z", venue: "NRG Stadium, Houston" },
  { id: "r16b", feeds: ["m79", "m81"], kickoff: "2026-07-04T21:00:00Z", venue: "Lincoln Financial Field, Philadelphia" },
  { id: "r16c", feeds: ["m74", "m77"], kickoff: "2026-07-05T20:00:00Z", venue: "MetLife Stadium, New York/NJ" },
  { id: "r16d", feeds: ["m75", "m76"], kickoff: "2026-07-06T00:00:00Z", venue: "Estadio Azteca, Mexico City" },
  { id: "r16e", feeds: ["m84", "m83"], kickoff: "2026-07-06T19:00:00Z", venue: "AT&T Stadium, Dallas" },
  { id: "r16f", feeds: ["m82", "m78"], kickoff: "2026-07-07T00:00:00Z", venue: "Lumen Field, Seattle" },
  { id: "r16g", feeds: ["m87", "m86"], kickoff: "2026-07-07T16:00:00Z", venue: "Mercedes-Benz Stadium, Atlanta" },
  { id: "r16h", feeds: ["m85", "m88"], kickoff: "2026-07-07T20:00:00Z", venue: "BC Place, Vancouver" },
];

const QF = [
  { id: "qf1", feeds: ["r16a", "r16b"], kickoff: "2026-07-09T20:00:00Z", venue: "Gillette Stadium, Boston", tbc: true },
  { id: "qf2", feeds: ["r16c", "r16d"], kickoff: "2026-07-10T20:00:00Z", venue: "SoFi Stadium, Los Angeles", tbc: true },
  { id: "qf3", feeds: ["r16e", "r16f"], kickoff: "2026-07-11T16:00:00Z", venue: "Arrowhead Stadium, Kansas City", tbc: true },
  { id: "qf4", feeds: ["r16g", "r16h"], kickoff: "2026-07-11T20:00:00Z", venue: "Hard Rock Stadium, Miami", tbc: true },
];

const SF = [
  { id: "sf1", feeds: ["qf1", "qf2"], kickoff: "2026-07-14T20:00:00Z", venue: "AT&T Stadium, Dallas" },
  { id: "sf2", feeds: ["qf3", "qf4"], kickoff: "2026-07-15T20:00:00Z", venue: "Mercedes-Benz Stadium, Atlanta" },
];

const FINAL = [
  { id: "final", feeds: ["sf1", "sf2"], kickoff: "2026-07-19T19:00:00Z", venue: "MetLife Stadium, New York/NJ" },
];

const ALL_KO = [...R32, ...R16, ...QF, ...SF, ...FINAL];
const ROUNDS = [
  { key: "R32", label: "Round of 32", matches: R32 },
  { key: "R16", label: "Round of 16", matches: R16 },
  { key: "QF", label: "Quarter-finals", matches: QF },
  { key: "SF", label: "Semi-finals", matches: SF },
  { key: "F", label: "Final", matches: FINAL },
];

const SCORERS = [
  { player: "Kylian Mbappé", team: "FRA", goals: 6 },
  { player: "Lionel Messi", team: "ARG", goals: 6 },
  { player: "Erling Haaland", team: "NOR", goals: 5 },
  { player: "Ousmane Dembélé", team: "FRA", goals: 4 },
  { player: "Vinícius Júnior", team: "BRA", goals: 4 },
  { player: "Harry Kane", team: "ENG", goals: 3, unverified: true },
  { player: "Jonathan David", team: "CAN", goals: 3 },
  { player: "Deniz Undav", team: "GER", goals: 3 },
  { player: "Kai Havertz", team: "GER", goals: 3 },
  { player: "Matheus Cunha", team: "BRA", goals: 3 },
  { player: "Ismaïla Sarr", team: "SEN", goals: 3 },
  { player: "Johan Manzambi", team: "SUI", goals: 3 },
  { player: "Cody Gakpo", team: "NED", goals: 3 },
  { player: "Brian Brobbey", team: "NED", goals: 3 },
  { player: "Ismael Saibari", team: "MAR", goals: 3 },
  { player: "Yoane Wissa", team: "COD", goals: 3 },
];

const ASSISTS = [
  { player: "Michael Olise", team: "FRA", assists: 5 },
  { player: "Bruno Guimarães", team: "BRA", assists: 4, unverified: true },
];

const CLEAN_SHEETS = [
  { player: "Raúl Rangel", team: "MEX", cs: 4, note: "3 in groups + shutout of Ecuador in the R32" },
  { player: "Unai Simón", team: "ESP", cs: 3, note: "Spain are yet to concede at this World Cup" },
];

// Editorial notes for match previews — only claims backed by reporting.
const MATCH_NOTES = {
  m84: "Rematch of the Euro 2016 final — Ronaldo and Modrić, remarkably, still lead their sides.",
  m83: "Spain arrive having not conceded a single goal in the tournament.",
  m87: "Messi, level with Mbappé on 6 goals, chases the Golden Boot against debutants Cape Verde.",
  r16c: "Haaland (5 goals) against the tournament's most in-form attack.",
  r16d: "A knockout classic at the Azteca: co-hosts Mexico, unbeaten and yet to concede in open play, meet England.",
  r16f: "USA vs Belgium — a rematch of the 2014 round-of-16 epic.",
};

const STATUS_META = {
  W: { label: "Won group", cls: "st-through" },
  RU: { label: "Runner-up", cls: "st-through" },
  T3: { label: "Best 3rd", cls: "st-third" },
  OUT: { label: "Eliminated", cls: "st-out" },
};

/* ============================ live data ============================ */
/* All results/stats live in public/live.json — the app polls it every 5s
   and hot-swaps state whenever the file changes. The constants above are
   the fallback snapshot if the fetch fails. */

const LIVE_DEFAULTS = {
  asOf: DATA_AS_OF,
  stage: "Round of 32 · knockout stage in progress",
  results: {},
  scorers: SCORERS,
  scorersNote: "Ties are ordered by assists per FIFA's Golden Boot rules.",
  assists: ASSISTS,
  cleanSheets: CLEAN_SHEETS,
  notes: MATCH_NOTES,
};

/* ---- ESPN public scoreboard: primary source for scores/fixtures ---- */
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260719";

function parseEspnEvents(json) {
  const events = [];
  for (const ev of json?.events ?? []) {
    const c = ev.competitions?.[0];
    const h = c?.competitors?.find((x) => x.homeAway === "home");
    const a = c?.competitors?.find((x) => x.homeAway === "away");
    if (!h || !a) continue;
    const codeOf = (x) =>
      TEAMS[x.team?.abbreviation]
        ? x.team.abbreviation
        : Object.keys(TEAMS).find((k) => TEAMS[k].name === x.team?.displayName) ?? null;
    const hc = codeOf(h), ac = codeOf(a);
    if (!hc || !ac) continue;
    const st = ev.status?.type ?? {};
    const pens =
      h.shootoutScore != null && a.shootoutScore != null
        ? `${h.shootoutScore}–${a.shootoutScore}`
        : null;
    // ESPN dates come as "2026-07-06T19:00Z" — add seconds for safe parsing
    const kickoff = ev.date ? ev.date.replace(/T(\d\d:\d\d)Z$/, "T$1:00Z") : null;
    events.push({
      hc, ac,
      hs: Number(h.score) || 0, as: Number(a.score) || 0,
      state: st.state, // pre | in | post
      pens,
      aet: st.detail === "AET",
      clock: ev.status?.displayClock,
      detail: st.shortDetail ?? st.detail,
      winner:
        st.state === "post"
          ? h.winner ? hc : a.winner ? ac
            : pens ? (h.shootoutScore > a.shootoutScore ? hc : ac) : null
          : null,
      kickoff,
      venue: c?.venue?.fullName
        ? `${c.venue.fullName}${c.venue.address?.city ? ", " + String(c.venue.address.city).split(",")[0] : ""}`
        : null,
    });
  }
  return events;
}

/* Match ESPN events to bracket slots by team pair. Multiple passes so that
   once early-round results land, later rounds' participants resolve and
   their events can be matched too. */
function applyEspnResults(events, baseResults) {
  const results = { ...baseResults };
  const used = new Set();
  for (let pass = 0; pass < 4 && used.size < events.length; pass++) {
    const byId = {};
    ALL_KO.forEach((m) => (byId[m.id] = { ...m, ...(results[m.id] || {}) }));
    const resolved = resolveBracket(byId, {});
    for (const ev of events) {
      if (used.has(ev)) continue;
      const match = ALL_KO.find((m) => {
        const r = resolved[m.id];
        return r.home && r.away &&
          ((r.home === ev.hc && r.away === ev.ac) || (r.home === ev.ac && r.away === ev.hc));
      });
      if (!match) continue;
      used.add(ev);
      const flip = resolved[match.id].home === ev.ac;
      const entry = { tbc: false, timeTBC: false };
      if (ev.kickoff) entry.kickoff = ev.kickoff;
      if (ev.venue) entry.venue = ev.venue;
      if (ev.state !== "pre") {
        entry.hs = flip ? ev.as : ev.hs;
        entry.as = flip ? ev.hs : ev.as;
        if (ev.pens) entry.pens = flip ? ev.pens.split("–").reverse().join("–") : ev.pens;
        if (ev.aet) entry.aet = true;
        if (ev.winner) entry.winner = ev.winner;
        if (ev.state === "in") entry.live = { clock: ev.clock, detail: ev.detail };
      }
      const next = { ...(results[match.id] || {}), ...entry };
      if (ev.state !== "in") delete next.live;
      results[match.id] = next;
    }
  }
  return results;
}

function useLiveData() {
  const [live, setLive] = useState(LIVE_DEFAULTS);
  const [lastSync, setLastSync] = useState(null);
  const [source, setSource] = useState("connecting"); // connecting | espn | local
  const prevRef = useRef("");
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const [jsonRes, espnRes] = await Promise.allSettled([
        fetch(`${import.meta.env.BASE_URL}live.json?t=${Date.now()}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch(ESPN_URL).then((r) => (r.ok ? r.json() : Promise.reject())),
      ]);
      if (stopped) return;
      const base = jsonRes.status === "fulfilled" ? jsonRes.value : {};
      const next = { ...LIVE_DEFAULTS, ...base, notes: { ...MATCH_NOTES, ...(base.notes || {}) } };
      let src = "local";
      if (espnRes.status === "fulfilled") {
        try {
          const events = parseEspnEvents(espnRes.value);
          if (events.length) {
            next.results = applyEspnResults(events, next.results);
            src = "espn";
            const stageName = espnRes.value?.leagues?.[0]?.season?.type?.name;
            if (stageName) next.stage = `${stageName} · knockout stage in progress`;
          }
        } catch { /* fall back to local results */ }
      }
      if (jsonRes.status === "fulfilled" || espnRes.status === "fulfilled") {
        setLastSync(new Date());
        setSource(src);
        const text = JSON.stringify(next);
        if (text !== prevRef.current) {
          prevRef.current = text;
          setLive(next);
        }
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { stopped = true; clearInterval(id); };
  }, []);
  return { live, lastSync, source };
}

const TourCtx = createContext(null);
const useTour = () => useContext(TourCtx);

/* ============================ helpers ============================ */

const flagOf = (c) => TEAMS[c]?.flag ?? "🏳️";
const nameOf = (c) => TEAMS[c]?.name ?? c;

function fmtLocal(iso, opts = {}) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", ...opts,
  });
}
function fmtTime(iso) {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

function groupOf(code) {
  return GROUPS.find((g) => g.rows.some((r) => r.t === code));
}

/* ============================ bracket engine ============================ */
/* Resolves each match's participants using real results first, then the
   user's predictions for anything undecided. */
function resolveBracket(byId, predictions) {
  const resolved = {};
  const winnerOf = (id) => {
    const r = resolve(id);
    if (r.winner) return { code: r.winner, real: true };
    if (predictions[id] && (predictions[id] === r.home || predictions[id] === r.away))
      return { code: predictions[id], real: false };
    return null;
  };
  const resolve = (id) => {
    if (resolved[id]) return resolved[id];
    const m = byId[id];
    let home = m.home ?? null, away = m.away ?? null;
    let homePredicted = false, awayPredicted = false;
    if (m.feeds) {
      const w0 = winnerOf(m.feeds[0]);
      const w1 = winnerOf(m.feeds[1]);
      home = w0?.code ?? null; homePredicted = w0 ? !w0.real : false;
      away = w1?.code ?? null; awayPredicted = w1 ? !w1.real : false;
    }
    resolved[id] = { ...m, home, away, homePredicted, awayPredicted };
    return resolved[id];
  };
  ALL_KO.forEach((m) => resolve(m.id));
  return resolved;
}

function useBracket(byId, predictions) {
  return useMemo(() => resolveBracket(byId, predictions), [byId, predictions]);
}

/* Everything derived from the current live results, shared via context. */
function buildTournament(live) {
  const merged = ALL_KO.map((m) => ({ ...m, ...(live.results[m.id] || {}) }));
  const byId = {};
  merged.forEach((m) => (byId[m.id] = m));
  const real = resolveBracket(byId, {}); // no predictions: real state only
  const koLosers = new Set();
  merged.forEach((m) => {
    const r = real[m.id];
    if (r.winner) {
      const loser = r.winner === r.home ? r.away : r.home;
      if (loser) koLosers.add(loser);
    }
  });
  const teamAlive = (code) => {
    const row = GROUPS.flatMap((g) => g.rows).find((r) => r.t === code);
    if (!row || row.st === "OUT") return false;
    return !koLosers.has(code);
  };
  const knockoutResults = (code) =>
    merged
      .filter((m) => real[m.id].winner && (real[m.id].home === code || real[m.id].away === code))
      .map((m) => {
        const r = real[m.id];
        const won = r.winner === code;
        const opp = r.home === code ? r.away : r.home;
        const score = r.home === code ? `${r.hs}–${r.as}` : `${r.as}–${r.hs}`;
        const round = ROUNDS.find((x) => x.matches.some((mm) => mm.id === m.id));
        return { opp, score, won, pens: r.pens, aet: r.aet, round: round?.key ?? "" };
      });
  return { live, merged, byId, real, teamAlive, knockoutResults };
}

// The chain of match ids a team would pass through to reach the final.
function pathToFinal(code, bracket) {
  const path = [];
  let current = ALL_KO.find(
    (m) => bracket[m.id].home === code || bracket[m.id].away === code
  );
  // find earliest round appearance
  for (const round of ROUNDS) {
    const hit = round.matches.find(
      (m) => bracket[m.id].home === code || bracket[m.id].away === code
    );
    if (hit) { current = hit; break; }
  }
  if (!current) return path;
  let id = current.id;
  while (id) {
    path.push(id);
    const next = ALL_KO.find((m) => m.feeds?.includes(id));
    id = next?.id;
  }
  return path;
}

/* ============================ styles ============================ */

const CSS = `
:root {
  --bg: #070b14; --bg2: #0c1220; --card: #101827; --card2: #16213a;
  --line: rgba(148,163,255,.12); --line2: rgba(148,163,255,.22);
  --text: #eef2ff; --muted: #8b96b8; --muted2: #5c6685;
  --accent: #2de38a; --accent-dim: rgba(45,227,138,.14);
  --red: #ff4b5c; --blue: #4d8dff; --gold: #ffc94d;
  --radius: 14px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg); color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }
button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }

.app { max-width: 1240px; margin: 0 auto; padding: 0 20px 80px; }

/* ---------- hero ---------- */
.hero {
  position: relative; overflow: hidden;
  margin: 20px 0 24px; padding: 36px 32px 32px;
  border-radius: 22px; border: 1px solid var(--line2);
  background:
    radial-gradient(1200px 500px at 85% -10%, rgba(77,141,255,.22), transparent 60%),
    radial-gradient(900px 420px at 0% 110%, rgba(45,227,138,.16), transparent 55%),
    radial-gradient(700px 300px at 45% -20%, rgba(255,75,92,.14), transparent 60%),
    linear-gradient(160deg, #0d1526 0%, #0a0f1d 100%);
}
.hero-top { display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between; align-items: flex-start; }
.hero-eyebrow { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; }
.hero h1 { font-size: clamp(30px, 5vw, 52px); font-weight: 800; letter-spacing: -.02em; line-height: 1.04; margin: 10px 0 8px; }
.hero h1 .grad { color: inherit; }
.hero-hosts { color: var(--muted); font-size: 15px; }
.stage-pill {
  display: inline-flex; align-items: center; gap: 8px; margin-top: 16px;
  padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 700;
  background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(45,227,138,.35);
}
.stage-pill .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.8s ease-in-out infinite; }
.sync-pill { display: flex; align-items: center; gap: 7px; margin-top: 10px; font-size: 11.5px; color: var(--muted); }
.sync-pill svg { color: var(--accent); }
.spin-slow { animation: spinSlow 5s linear infinite; }
@keyframes spinSlow { to { transform: rotate(360deg); } }

/* ---------- live match states ---------- */
.live-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: pulse 1.1s ease-in-out infinite; }
.live-tag { display: inline-flex; align-items: center; gap: 5px; margin-left: 8px; color: var(--red); font-weight: 800; font-size: 10.5px; letter-spacing: .06em; }
.countdown.islive { border-color: rgba(255,75,92,.45); box-shadow: 0 0 24px rgba(255,75,92,.12); }
.countdown.islive .cd-label { color: var(--red); font-weight: 800; }
.cd-live-score { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0 6px; font-weight: 700; font-size: 15px; }
.cd-live-score b { font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text); }
.cd-live-clock { text-align: center; color: var(--red); font-weight: 800; font-size: 13px; font-variant-numeric: tabular-nums; }
.rnode.livenode circle.bg { stroke: var(--red); stroke-width: 2.5; animation: liveRing 1.4s ease-in-out infinite; }
@keyframes liveRing { 0%,100% { filter: drop-shadow(0 0 2px rgba(255,75,92,.4)); } 50% { filter: drop-shadow(0 0 9px rgba(255,75,92,.9)); } }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: .4; transform: scale(.75);} }

.countdown { min-width: 280px; background: rgba(7,11,20,.55); border: 1px solid var(--line2); border-radius: var(--radius); padding: 16px 18px; backdrop-filter: blur(6px); }
.countdown .cd-label { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.cd-teams { display: flex; align-items: center; gap: 10px; margin: 10px 0 12px; font-weight: 700; font-size: 16px; }
.cd-digits { display: flex; gap: 8px; }
.cd-cell { flex: 1; text-align: center; background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 8px 4px; }
.cd-cell b { display: block; font-size: 24px; font-variant-numeric: tabular-nums; }
.cd-cell span { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted2); }

.hero-scorers { margin-top: 28px; }
.hero-scorers h3 { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.scorer-row { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; }
.scorer-card {
  background: rgba(16,24,39,.7); border: 1px solid var(--line); border-radius: 12px; padding: 12px;
  transition: transform .18s ease, border-color .18s ease;
}
.scorer-card:hover { transform: translateY(-3px); border-color: var(--line2); }
.scorer-card .rank { font-size: 11px; color: var(--muted2); font-weight: 700; }
.scorer-card .sc-name { font-weight: 700; font-size: 14px; margin: 4px 0 2px; line-height: 1.2; }
.scorer-card .sc-team { font-size: 12px; color: var(--muted); }
.scorer-card .sc-goals { margin-top: 8px; font-size: 22px; font-weight: 800; color: var(--accent); display: flex; align-items: baseline; gap: 5px; }
.scorer-card .sc-goals small { font-size: 11px; color: var(--muted2); font-weight: 600; }

/* ---------- fixtures strip ---------- */
.section-h { display: flex; align-items: center; gap: 10px; margin: 30px 0 14px; }
.section-h h2 { font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
.section-h .icn { color: var(--accent); }
.strip { display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 14px; scrollbar-width: thin; }
.fix-card {
  min-width: 250px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.fix-card:hover { transform: translateY(-3px); border-color: var(--line2); box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.fix-round { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--blue); }
.fix-teams { display: flex; flex-direction: column; gap: 6px; }
.fix-team { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; }
.fix-team.fav { color: var(--gold); }
.fix-meta { font-size: 12px; color: var(--muted); display: flex; flex-direction: column; gap: 3px; }
.fix-meta span { display: flex; align-items: center; gap: 6px; }
.preview-btn {
  margin-top: 2px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: var(--accent);
  padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(45,227,138,.3);
  transition: background .15s ease, transform .1s ease;
}
.preview-btn:hover { background: var(--accent-dim); }
.preview-btn:active { transform: scale(.97); }

/* ---------- nav tabs ---------- */
.viewnav { position: sticky; top: 0; z-index: 30; display: flex; gap: 8px; padding: 12px 0; margin-top: 8px;
  background: linear-gradient(var(--bg) 80%, transparent); }
.viewnav button {
  padding: 10px 18px; border-radius: 999px; font-weight: 700; font-size: 14px;
  color: var(--muted); border: 1px solid transparent; transition: color .15s, background .15s, border-color .15s;
}
.viewnav button:hover { color: var(--text); }
.viewnav button.on { color: #04140b; background: var(--accent); }

/* ---------- groups ---------- */
.groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }
.group-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; overflow-x: auto; }
.group-card header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card2); font-weight: 800; }
.group-card header small { color: var(--muted2); font-weight: 600; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.gtable { width: 100%; border-collapse: collapse; font-size: 13px; }
.gtable th { text-align: right; padding: 8px 6px; color: var(--muted2); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
.gtable th:first-child { text-align: left; padding-left: 14px; }
.gtable td { padding: 9px 6px; text-align: right; border-top: 1px solid var(--line); font-variant-numeric: tabular-nums; }
.gtable td:first-child { text-align: left; padding-left: 10px; }
.gtable td.pts { font-weight: 800; }
.trow { cursor: pointer; transition: background .13s ease; }
.trow:hover { background: rgba(148,163,255,.06); }
.trow.fav td:first-child .tname { color: var(--gold); }
.tcell { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.tcell .stbar { width: 3px; height: 22px; border-radius: 2px; flex: none; }
.st-through .stbar { background: var(--accent); }
.st-third .stbar { background: var(--blue); }
.st-out .stbar { background: rgba(255,75,92,.55); }
.st-out .tname, .st-out td { color: var(--muted2); }
.dead { opacity: .55; }
.legend { display: flex; flex-wrap: wrap; gap: 14px; margin: 14px 2px 0; font-size: 12px; color: var(--muted); }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }

/* ---------- side panel ---------- */
.scrim { position: fixed; inset: 0; background: rgba(3,6,12,.6); backdrop-filter: blur(2px); z-index: 60; animation: fadein .2s ease; }
@keyframes fadein { from { opacity: 0; } }
.panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 92vw); z-index: 70;
  background: var(--bg2); border-left: 1px solid var(--line2); padding: 24px; overflow-y: auto;
  animation: slidein .25s cubic-bezier(.2,.8,.25,1);
}
@keyframes slidein { from { transform: translateX(40px); opacity: 0; } }
.panel .close { position: absolute; top: 16px; right: 16px; color: var(--muted); padding: 6px; border-radius: 8px; }
.panel .close:hover { color: var(--text); background: rgba(148,163,255,.08); }
.panel-flag { font-size: 52px; line-height: 1; }
.panel h2 { font-size: 26px; font-weight: 800; margin: 8px 0 4px; }
.panel .sub { color: var(--muted); font-size: 13px; margin-bottom: 14px; }
.favbtn { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line2); color: var(--muted); transition: all .15s ease; }
.favbtn:hover { color: var(--gold); border-color: rgba(255,201,77,.5); }
.favbtn.on { color: #1a1200; background: var(--gold); border-color: var(--gold); }
.pblock { margin-top: 22px; }
.pblock h4 { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
.pitem { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 12px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 8px; font-size: 13px; }
.pitem b { font-weight: 700; }
.pitem .res-w { color: var(--accent); font-weight: 800; }
.pitem .res-l { color: var(--red); font-weight: 800; }
.chip { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.chip.g { background: var(--accent-dim); color: var(--accent); }
.chip.r { background: rgba(255,75,92,.14); color: var(--red); }
.chip.b { background: rgba(77,141,255,.14); color: var(--blue); }
.stars-list { display: flex; flex-wrap: wrap; gap: 8px; }
.star-chip { padding: 7px 12px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); font-size: 13px; font-weight: 600; }
.path-step { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--line); font-size: 13px; }
.path-step .rd { width: 92px; flex: none; color: var(--muted2); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }

/* ---------- bracket ---------- */
.bracket-tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; font-size: 13px; color: var(--muted); }
.mode-toggle { display: inline-flex; border: 1px solid var(--line2); border-radius: 999px; overflow: hidden; }
.mode-toggle button { padding: 8px 16px; font-size: 13px; font-weight: 700; color: var(--muted); display: inline-flex; gap: 6px; align-items: center; }
.mode-toggle button.on { background: var(--accent); color: #04140b; }
.clear-btn { font-size: 12px; font-weight: 700; color: var(--red); padding: 8px 12px; border-radius: 8px; }
.clear-btn:hover { background: rgba(255,75,92,.1); }
.bracket-scroll { overflow-x: auto; padding-bottom: 14px; }
.bracket { display: flex; gap: 22px; min-width: 1080px; }
.bcol { flex: 1; display: flex; flex-direction: column; }
.bcol > h5 { text-align: center; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
.bcol-inner { flex: 1; display: flex; flex-direction: column; justify-content: space-around; gap: 10px; }
.bmatch {
  background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 8px;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.bmatch:hover { border-color: var(--line2); }
.bmatch.onpath { border-color: rgba(45,227,138,.55); box-shadow: 0 0 0 1px rgba(45,227,138,.35), 0 6px 24px rgba(45,227,138,.12); }
.bmatch .bmeta { font-size: 10px; color: var(--muted2); padding: 2px 6px 6px; display: flex; gap: 6px; align-items: center; }
.bteam {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px;
  font-size: 13px; font-weight: 700; text-align: left; transition: background .12s ease;
}
.bteam .bscore { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 800; }
.bteam.winner { color: var(--text); }
.bteam.loser { color: var(--muted2); }
.bteam.tbd { color: var(--muted2); font-weight: 600; font-style: italic; }
.bteam.predicted { color: var(--blue); }
.bteam.fav { color: var(--gold); }
.bteam.clickable:hover { background: rgba(148,163,255,.09); }
.pens-note { font-size: 10px; color: var(--muted); padding: 0 8px 4px; }
.pred-tag { font-size: 9px; font-weight: 800; letter-spacing: .08em; color: var(--blue); border: 1px solid rgba(77,141,255,.4); padding: 1px 5px; border-radius: 4px; }

/* ---------- stats ---------- */
.stats-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.stats-tabs button { padding: 9px 15px; border-radius: 10px; font-size: 13px; font-weight: 700; color: var(--muted); border: 1px solid var(--line); transition: all .15s ease; }
.stats-tabs button:hover { color: var(--text); border-color: var(--line2); }
.stats-tabs button.on { color: #04140b; background: var(--accent); border-color: var(--accent); }
.stat-table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: var(--radius); overflow: hidden; font-size: 14px; }
.stat-table th { text-align: left; padding: 12px 14px; background: var(--card2); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); cursor: pointer; user-select: none; white-space: nowrap; }
.stat-table th:hover { color: var(--text); }
.stat-table td { padding: 12px 14px; border-top: 1px solid var(--line); }
.stat-table tr:hover td { background: rgba(148,163,255,.05); }
.stat-table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 800; }
.chart-wrap { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px 10px 6px; margin-bottom: 18px; }
.empty-tab { background: var(--card); border: 1px dashed var(--line2); border-radius: var(--radius); padding: 34px 24px; text-align: center; color: var(--muted); font-size: 14px; line-height: 1.6; }
.note-line { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--muted); margin-top: 12px; line-height: 1.5; }

/* ---------- modal ---------- */
.modal-wrap { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { position: relative; width: min(620px, 100%); max-height: 86vh; overflow-y: auto; background: var(--bg2); border: 1px solid var(--line2); border-radius: 18px; padding: 26px; animation: modalin .22s cubic-bezier(.2,.8,.25,1); }
@keyframes modalin { from { transform: translateY(14px) scale(.98); opacity: 0; } }
.modal h3 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.mvs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin: 18px 0; }
.mvs .side { text-align: center; }
.mvs .side .f { font-size: 44px; }
.mvs .side .n { font-weight: 800; margin-top: 6px; }
.mvs .vs { color: var(--muted2); font-weight: 800; font-size: 13px; }
.h2h-note { background: var(--accent-dim); border: 1px solid rgba(45,227,138,.25); color: #c9f7dd; border-radius: 10px; padding: 12px 14px; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
.form-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-col { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
.form-col h5 { font-size: 12px; font-weight: 800; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
.form-col ul { list-style: none; font-size: 12.5px; color: var(--muted); display: flex; flex-direction: column; gap: 7px; }
.form-col li b { color: var(--text); }
.wdl { display: flex; gap: 5px; margin-bottom: 10px; }
.wdl i { width: 20px; height: 20px; border-radius: 6px; font-style: normal; font-size: 10px; font-weight: 800; display: grid; place-items: center; }
.wdl .W { background: rgba(45,227,138,.2); color: var(--accent); }
.wdl .D { background: rgba(148,163,255,.15); color: #aab4d8; }
.wdl .L { background: rgba(255,75,92,.16); color: var(--red); }

.foot { margin-top: 44px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted2); font-size: 12px; line-height: 1.7; }

/* ---------- motion ---------- */
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes riseSoft { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.view-anim { animation: rise .45s cubic-bezier(.2,.8,.25,1) both; }
.stagger { animation: rise .55s cubic-bezier(.2,.8,.25,1) both; }
@keyframes numTick { from { opacity: .2; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.cd-cell b span { display: inline-block; animation: numTick .35s ease both; }
.hero::after {
  content: ""; position: absolute; inset: -40%; pointer-events: none; opacity: .5;
  background: conic-gradient(from 0deg, transparent 0 70%, rgba(45,227,138,.08) 78%, rgba(77,141,255,.10) 86%, rgba(255,75,92,.07) 93%, transparent 100%);
  animation: heroSpin 26s linear infinite;
}
@keyframes heroSpin { to { transform: rotate(360deg); } }
.hero > * { position: relative; z-index: 1; }

/* ---------- radial bracket ---------- */
.radial-wrap { position: relative; max-width: 860px; margin: 0 auto; }
.radial-wrap svg { width: 100%; height: auto; display: block; }
.radial-bg {
  border-radius: 24px; border: 1px solid var(--line);
  background:
    radial-gradient(closest-side at 50% 50%, rgba(255,201,77,.10), rgba(255,201,77,.03) 45%, transparent 70%),
    radial-gradient(1200px 900px at 50% 120%, #131b2e, transparent),
    #0a0f1c;
  padding: clamp(4px, 2vw, 18px);
}
.ring-g { transform-origin: 500px 500px; opacity: 0; animation: ringIn .8s cubic-bezier(.2,.8,.25,1) forwards; }
@keyframes ringIn { from { opacity: 0; transform: rotate(-7deg) scale(.94); } to { opacity: 1; transform: none; } }
.rnode { cursor: pointer; }
.rnode circle.bg { transition: r .18s ease, stroke .18s ease, filter .2s ease; }
.rnode:hover circle.bg { filter: brightness(1.35) drop-shadow(0 0 6px rgba(45,227,138,.5)); }
.rnode text { pointer-events: none; user-select: none; }
.rnode.dim { opacity: .38; }
.rnode.onpath circle.bg { stroke: var(--accent); stroke-width: 3; filter: drop-shadow(0 0 8px rgba(45,227,138,.7)); }
.rnode.favnode circle.bg { stroke: var(--gold); stroke-width: 3; filter: drop-shadow(0 0 8px rgba(255,201,77,.7)); }
.rnode.predicted circle.bg { stroke: var(--blue); stroke-width: 2.5; }
.slot-pop { animation: slotPop .55s cubic-bezier(.2,.85,.3,1.15) both; }
@keyframes slotPop {
  from { opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.35); }
  to { opacity: 1; transform: translate(0, 0) scale(1); }
}
.rlink { fill: none; stroke: rgba(148,163,255,.22); stroke-width: 1.6; transition: stroke .2s ease; }
.rlink.done { stroke: rgba(148,163,255,.42); }
.rlink.hot {
  stroke: var(--accent); stroke-width: 3; filter: drop-shadow(0 0 5px rgba(45,227,138,.6));
  stroke-dasharray: 600; stroke-dashoffset: 600; animation: drawline 1s ease forwards;
}
.rlink.hotgold { stroke: var(--gold); stroke-width: 3; filter: drop-shadow(0 0 5px rgba(255,201,77,.55));
  stroke-dasharray: 600; stroke-dashoffset: 600; animation: drawline 1s ease forwards; }
@keyframes drawline { to { stroke-dashoffset: 0; } }
.trophy-glow { animation: trophyPulse 3.2s ease-in-out infinite; transform-origin: 500px 500px; }
@keyframes trophyPulse { 0%,100% { opacity: .55; transform: scale(1);} 50% { opacity: 1; transform: scale(1.08);} }
.trophy-emoji { animation: trophyFloat 4.5s ease-in-out infinite; transform-origin: 500px 505px; }
@keyframes trophyFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-7px);} }
.champ-banner { animation: slotPop .7s cubic-bezier(.2,.85,.3,1.2) both; }
.rtip {
  position: absolute; z-index: 20; pointer-events: none; transform: translate(-50%, -130%);
  background: rgba(10,15,28,.94); border: 1px solid var(--line2); border-radius: 10px;
  padding: 8px 12px; font-size: 12px; line-height: 1.5; white-space: nowrap;
  box-shadow: 0 8px 28px rgba(0,0,0,.5); animation: riseSoft .15s ease both;
}
.rtip b { display: block; font-size: 13px; }
.rtip .sub2 { color: var(--muted); }
.layout-toggle { display: inline-flex; border: 1px solid var(--line2); border-radius: 999px; overflow: hidden; }
.layout-toggle button { padding: 8px 16px; font-size: 13px; font-weight: 700; color: var(--muted); display: inline-flex; gap: 6px; align-items: center; }
.layout-toggle button.on { background: var(--card2); color: var(--text); }

@media (max-width: 900px) {
  .scorer-row { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hero { padding: 26px 20px; }
  .hero-top { flex-direction: column; }
  .countdown { width: 100%; min-width: 0; }
  .form-cols { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .app { padding: 0 12px 60px; }
  .groups-grid { grid-template-columns: minmax(0,1fr); }
  .scorer-row { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hero-top > div { min-width: 0; }
  .cd-digits { flex-wrap: wrap; }
  .cd-cell { min-width: 56px; }
}
`;

/* ============================ components ============================ */

function Countdown({ match, round }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!match) return null;
  const { kickoff: target, home, away } = match;
  if (match.live) {
    return (
      <div className="countdown islive">
        <div className="cd-label"><span className="live-dot" /> Live now · {round}</div>
        <div className="cd-live-score">
          <span>{flagOf(home)} {nameOf(home)}</span>
          <b>{match.hs}–{match.as}</b>
          <span>{nameOf(away)} {flagOf(away)}</span>
        </div>
        <div className="cd-live-clock">{match.live.clock}{match.live.detail ? ` · ${match.live.detail}` : ""}</div>
        {match.venue && <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}><MapPin size={11} style={{ verticalAlign: -1 }} /> {match.venue}</div>}
      </div>
    );
  }
  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div className="countdown">
      <div className="cd-label"><Clock size={13} /> Next match · {round}</div>
      <div className="cd-teams">
        <span>{flagOf(home)} {nameOf(home)}</span>
        <span style={{ color: "var(--muted2)", fontSize: 12 }}>vs</span>
        <span>{flagOf(away)} {nameOf(away)}</span>
      </div>
      <div className="cd-digits">
        {[[d, "days"], [pad(h), "hrs"], [pad(m), "min"], [pad(s), "sec"]].map(([v, l]) => (
          <div className="cd-cell" key={l}><b><span key={v}>{v}</span></b><span>{l}</span></div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
        {fmtLocal(target)} · Central Time (CT)
      </div>
    </div>
  );
}

function Wdl({ w, d, l }) {
  const seq = [
    ...Array(w).fill("W"),
    ...Array(d).fill("D"),
    ...Array(l).fill("L"),
  ];
  return (
    <div className="wdl" title="Group-stage record (not chronological)">
      {seq.map((r, i) => <i key={i} className={r}>{r}</i>)}
    </div>
  );
}

function PreviewModal({ match, onClose }) {
  const { live, knockoutResults } = useTour();
  const { home, away } = match;
  const roundLabel = ROUNDS.find((r) => r.matches.some((m) => m.id === match.id))?.label;
  const note = live.notes[match.id];
  const sideInfo = (code) => {
    const g = groupOf(code);
    const row = g?.rows.find((r) => r.t === code);
    const ko = knockoutResults(code);
    return { g, row, ko };
  };
  const H = sideInfo(home), A = sideInfo(away);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap" role="dialog" aria-modal="true">
        <div className="modal">
          <button className="close" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, color: "var(--muted)" }}><X size={20} /></button>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--blue)" }}>{roundLabel} · Match preview</div>
          <div className="mvs">
            <div className="side"><div className="f">{flagOf(home)}</div><div className="n">{nameOf(home)}</div></div>
            <div className="vs">VS</div>
            <div className="side"><div className="f">{flagOf(away)}</div><div className="n">{nameOf(away)}</div></div>
          </div>
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
            <Calendar size={13} style={{ verticalAlign: -2 }} /> {fmtLocal(match.kickoff)}{match.timeTBC && " ※ time unconfirmed"}
            {match.venue && <> · <MapPin size={13} style={{ verticalAlign: -2 }} /> {match.venue}</>}
          </div>
          {note && <div className="h2h-note"><Flame size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{note}</div>}
          <div className="form-cols">
            {[[home, H], [away, A]].map(([code, S]) => (
              <div className="form-col" key={code}>
                <h5>{flagOf(code)} {nameOf(code)} — tournament so far</h5>
                {S.row && <Wdl w={S.row.w} d={S.row.d} l={S.row.l} />}
                <ul>
                  {S.row && (
                    <li>Group {S.g.id}: <b>{S.row.pts} pts</b>, {S.row.gf}–{S.row.ga} goals ({STATUS_META[S.row.st].label})</li>
                  )}
                  {S.ko.map((r, i) => (
                    <li key={i}>
                      {r.round} vs {flagOf(r.opp)} {nameOf(r.opp)}: <b>{r.score}{r.pens ? ` (${r.pens} pens)` : r.aet ? " (aet)" : ""}</b>{" "}
                      <span style={{ color: r.won ? "var(--accent)" : "var(--red)", fontWeight: 800 }}>{r.won ? "W" : "L"}</span>
                    </li>
                  ))}
                  {TEAMS[code].stars.length > 0 && <li>Key players: <b>{TEAMS[code].stars.join(", ")}</b></li>}
                </ul>
              </div>
            ))}
          </div>
          <div className="note-line"><Info size={13} style={{ flex: "none", marginTop: 2 }} /> Group records are aggregate W-D-L (match order not shown). Data as of {live.asOf}.</div>
        </div>
      </div>
    </>
  );
}

function TeamPanel({ code, onClose, favorite, setFavorite, bracket }) {
  const { teamAlive, knockoutResults } = useTour();
  const g = groupOf(code);
  const row = g?.rows.find((r) => r.t === code);
  const ko = knockoutResults(code);
  const alive = teamAlive(code);
  const path = alive ? pathToFinal(code, bracket) : [];
  const roundOfMatch = (id) => ROUNDS.find((r) => r.matches.some((m) => m.id === id))?.label;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel" role="dialog" aria-modal="true" aria-label={`${nameOf(code)} details`}>
        <button className="close" onClick={onClose} aria-label="Close panel"><X size={20} /></button>
        <div className="panel-flag">{flagOf(code)}</div>
        <h2>{nameOf(code)}</h2>
        <div className="sub">
          Group {g?.id} · {row && STATUS_META[row.st].label} ·{" "}
          {alive
            ? <span className="chip g">Still alive</span>
            : row?.st === "OUT"
              ? <span className="chip r">Out in groups</span>
              : <span className="chip r">Out — {ko.find((r) => !r.won)?.round === "R16" ? "Round of 16" : "Round of 32"}</span>}
        </div>
        <button className={`favbtn ${favorite === code ? "on" : ""}`} onClick={() => setFavorite(favorite === code ? null : code)}>
          <Star size={14} fill={favorite === code ? "currentColor" : "none"} />
          {favorite === code ? "Your team" : "Set as my team"}
        </button>

        {row && (
          <div className="pblock">
            <h4><Shield size={13} /> Group {g.id} record</h4>
            <div className="pitem">
              <span>P {row.p} · W {row.w} · D {row.d} · L {row.l}</span>
              <span>GF {row.gf} · GA {row.ga}</span>
              <b>{row.pts} pts</b>
            </div>
          </div>
        )}

        {ko.length > 0 && (
          <div className="pblock">
            <h4><Zap size={13} /> Knockout results</h4>
            {ko.map((r, i) => (
              <div className="pitem" key={i}>
                <span>{r.round} · vs {flagOf(r.opp)} {nameOf(r.opp)}</span>
                <b>{r.score}{r.pens ? ` (${r.pens}p)` : r.aet ? " (aet)" : ""}</b>
                <span className={r.won ? "res-w" : "res-l"}>{r.won ? "W" : "L"}</span>
              </div>
            ))}
          </div>
        )}

        {alive && path.length > 0 && (
          <div className="pblock">
            <h4><TrendingUp size={13} /> Path to the final</h4>
            {path.map((id) => {
              const m = bracket[id];
              const opp = m.home === code ? m.away : m.home === null ? null : m.home;
              const played = !!m.winner;
              const involved = m.home === code || m.away === code;
              return (
                <div className="path-step" key={id}>
                  <span className="rd">{roundOfMatch(id)}</span>
                  <span style={{ flex: 1 }}>
                    {involved && opp
                      ? <>vs {flagOf(opp)} <b>{nameOf(opp)}</b>{(m.homePredicted || m.awayPredicted) && opp !== code ? " (projected)" : ""}</>
                      : <span style={{ color: "var(--muted2)" }}>Opponent TBD</span>}
                  </span>
                  {played && involved && <span className={m.winner === code ? "res-w" : "res-l"}>{m.winner === code ? "W" : "L"}</span>}
                  {!played && m.kickoff && <span style={{ color: "var(--muted2)", fontSize: 11 }}>{fmtLocal(m.kickoff, { hour: undefined, minute: undefined })}</span>}
                </div>
              );
            })}
            <div className="note-line"><Info size={13} style={{ flex: "none", marginTop: 2 }} /> Future opponents use real results where played, then your bracket predictions.</div>
          </div>
        )}

        {TEAMS[code].stars.length > 0 && (
          <div className="pblock">
            <h4><Users size={13} /> Squad highlights</h4>
            <div className="stars-list">
              {TEAMS[code].stars.map((s) => <span className="star-chip" key={s}>{s}</span>)}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function GroupsView({ onTeam, favorite }) {
  const { teamAlive } = useTour();
  return (
    <>
      <div className="groups-grid">
        {GROUPS.map((g) => (
          <div className="group-card" key={g.id}>
            <header><span>Group {g.id}</span><small>Final table</small></header>
            <table className="gtable">
              <thead>
                <tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {g.rows.map((r) => {
                  const meta = STATUS_META[r.st];
                  const gd = r.gf - r.ga;
                  const alive = teamAlive(r.t);
                  return (
                    <tr
                      key={r.t}
                      className={`trow ${meta.cls} ${favorite === r.t ? "fav" : ""} ${!alive && r.st !== "OUT" ? "dead" : ""}`}
                      onClick={() => onTeam(r.t)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && onTeam(r.t)}
                    >
                      <td>
                        <span className="tcell">
                          <i className="stbar" />
                          <span>{flagOf(r.t)}</span>
                          <span className="tname">{nameOf(r.t)}</span>
                          {favorite === r.t && <Star size={11} fill="currentColor" color="var(--gold)" />}
                        </span>
                      </td>
                      <td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td>
                      <td>{r.gf}</td><td>{r.ga}</td>
                      <td>{gd > 0 ? `+${gd}` : gd}</td>
                      <td className="pts">{r.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--accent)" }} />Advanced (top two)</span>
        <span><i style={{ background: "var(--blue)" }} />Advanced (best third)</span>
        <span><i style={{ background: "rgba(255,75,92,.55)" }} />Eliminated in groups</span>
        <span>Dimmed rows: knocked out in the Round of 32 · click any team for details</span>
      </div>
    </>
  );
}

function useBracketClick(mode, selected, setSelected, setPredictions) {
  return useCallback((match, code) => {
    if (!code) return;
    if (mode === "predict" && !match.winner) {
      setPredictions((p) => {
        const next = { ...p };
        if (next[match.id] === code) delete next[match.id];
        else next[match.id] = code;
        return next;
      });
    } else {
      setSelected((s) => (s === code ? null : code));
    }
  }, [mode, setSelected, setPredictions]);
}

/* ---------- radial (orbit) bracket ---------- */

const ORBIT_ORDERS = [
  ["m73", "m80", "m79", "m81", "m74", "m77", "m75", "m76", "m84", "m83", "m82", "m78", "m87", "m86", "m85", "m88"],
  ["r16a", "r16b", "r16c", "r16d", "r16e", "r16f", "r16g", "r16h"],
  ["qf1", "qf2", "qf3", "qf4"],
  ["sf1", "sf2"],
  ["final"],
];
const ORBIT_RADII = [442, 348, 258, 170, 96];
const ORBIT_BADGE = [26, 27, 29, 31, 34];
const CX = 500, CY = 500;

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
// participant slot angle: ring with M matches → 2M slots clockwise from top
const slotAngle = (ring, k, s) => {
  const M = ORBIT_ORDERS[ring].length;
  return -90 + (2 * k + s + 0.5) * (360 / (2 * M));
};

function RadialBracket({ bracket, predictions, favorite, selected, onTeamClick }) {
  const { teamAlive } = useTour();
  const [tip, setTip] = useState(null);
  const highlight = useMemo(
    () => (selected ? new Set(pathToFinal(selected, bracket)) : new Set()),
    [selected, bracket]
  );

  const roundLabelOf = (id) => ROUNDS.find((r) => r.matches.some((m) => m.id === id))?.label;

  // one participant badge + its connector toward the next ring
  const items = [];
  ORBIT_ORDERS.forEach((ids, ring) => {
    const ringNodes = [];
    const ringLinks = [];
    ids.forEach((id, k) => {
      const m = bracket[id];
      const rOut = ORBIT_RADII[ring];
      const inner = ring < ORBIT_ORDERS.length - 1
        ? { ring: ring + 1, k: Math.floor(k / 2), s: k % 2 }
        : null;
      const innerAngle = inner ? slotAngle(inner.ring, inner.k, inner.s) : 0;
      const rIn = inner ? ORBIT_RADII[inner.ring] : 46;
      const rMid = (rOut + rIn) / 2;

      [0, 1].forEach((s) => {
        const code = s === 0 ? m.home : m.away;
        const isPredictedEntry = s === 0 ? m.homePredicted : m.awayPredicted;
        const aTeam = slotAngle(ring, k, s);
        const [x, y] = polar(rOut, aTeam);
        const played = !!m.winner;
        const isWinner = played && m.winner === code;
        const isLoserDone = (played && code && !isWinner) || (code && !teamAlive(code) && ring === 0 && !played);
        const onpath = code && selected === code && (highlight.has(id) || ring === 0);
        // connector: team → elbow → match junction (at winner angle)
        const aWin = inner ? innerAngle : (s === 0 ? 0 : 180);
        const [ex, ey] = polar(rMid, aTeam);
        const [jx, jy] = polar(rMid, aWin);
        const hot = code && selected === code;
        ringLinks.push(
          <path
            key={`${id}-${s}-ln`}
            className={`rlink ${played ? "done" : ""} ${hot ? (favorite === code ? "hotgold" : "hot") : ""}`}
            d={`M ${x} ${y} L ${ex} ${ey} L ${jx} ${jy}`}
          />
        );
        // badge
        const sub = m.live
          ? `LIVE ${m.live.clock} — ${nameOf(m.home)} ${m.hs}–${m.as} ${nameOf(m.away)}`
          : played
            ? `${nameOf(m.home)} ${m.hs}–${m.as} ${nameOf(m.away)}${m.pens ? ` (${m.pens} pens)` : m.aet ? " (aet)" : ""}`
            : m.home && m.away
              ? `${fmtLocal(m.kickoff)}${m.venue ? " · " + m.venue.split(",")[0] : ""}`
              : "Awaiting qualifiers";
        // slide-in offset: badges pop inward from their feeder's direction
        const feederAngle = ring > 0 ? slotAngle(ring - 1, 2 * k + s, 0.5) : aTeam;
        const [fx, fy] = polar(ORBIT_RADII[Math.max(0, ring - 1)], ring > 0 ? feederAngle : aTeam);
        ringNodes.push(
          <g
            key={`${id}-${s}`}
            transform={`translate(${x} ${y})`}
            className={[
              "rnode",
              m.live ? "livenode" : "",
              isLoserDone ? "dim" : "",
              onpath ? "onpath" : "",
              favorite === code && code ? "favnode" : "",
              (isPredictedEntry || (!played && predictions[m.id] === code && code)) ? "predicted" : "",
            ].join(" ")}
            onClick={() => code && onTeamClick(m, code)}
            onMouseEnter={() => code && setTip({
              x, y,
              title: `${flagOf(code)} ${nameOf(code)}`,
              sub: `${roundLabelOf(id)} — ${sub}`,
            })}
            onMouseLeave={() => setTip(null)}
          >
            <g
              key={code ?? "tbd"}
              className={ring > 0 && code ? "slot-pop" : undefined}
              style={ring > 0 && code ? { "--dx": `${fx - x}px`, "--dy": `${fy - y}px` } : undefined}
            >
              <circle className="bg" r={ORBIT_BADGE[ring]} fill="#0d1424" stroke={code ? "rgba(148,163,255,.35)" : "rgba(148,163,255,.15)"} strokeWidth="1.5" strokeDasharray={code ? "0" : "4 4"} />
              {code
                ? <text textAnchor="middle" dominantBaseline="central" fontSize={ORBIT_BADGE[ring] * 1.25}>{flagOf(code)}</text>
                : <text textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#5c6685" fontWeight="700">?</text>}
            </g>
          </g>
        );
      });
      // shared segment: junction → winner slot on the inner ring (or trophy)
      const [jx2, jy2] = polar(rMid, inner ? innerAngle : 0);
      const winCode = m.winner || predictions[id];
      if (inner) {
        const [wx, wy] = polar(rIn, innerAngle);
        ringLinks.push(
          <path key={`${id}-in`} className={`rlink ${m.winner ? "done" : ""} ${winCode && selected === winCode ? (favorite === winCode ? "hotgold" : "hot") : ""}`} d={`M ${jx2} ${jy2} L ${wx} ${wy}`} />
        );
      } else {
        // final → trophy
        [0, 180].forEach((aa, i) => {
          const [ax, ay] = polar(ORBIT_RADII[4] - ORBIT_BADGE[4], aa);
          const [bx, by] = polar(52, aa);
          ringLinks.push(<path key={`fin-${i}`} className="rlink" d={`M ${ax} ${ay} L ${bx} ${by}`} />);
        });
      }
    });
    items.push(
      <g key={`ring-${ring}`} className="ring-g" style={{ animationDelay: `${0.1 + ring * 0.13}s` }}>
        {ringLinks}
        {ringNodes}
      </g>
    );
  });

  const finalM = bracket.final;
  const champion = finalM.winner || predictions.final || null;

  return (
    <div className="radial-bg">
      <div className="radial-wrap">
        <svg viewBox="0 0 1000 1000" role="img" aria-label="World Cup 2026 knockout bracket, radial view">
          <defs>
            <radialGradient id="trophyGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255,201,77,.5)" />
              <stop offset="55%" stopColor="rgba(255,201,77,.12)" />
              <stop offset="100%" stopColor="rgba(255,201,77,0)" />
            </radialGradient>
          </defs>
          {items}
          <g className="ring-g" style={{ animationDelay: "0.75s" }}>
            <circle className="trophy-glow" cx={CX} cy={CY} r="78" fill="url(#trophyGlow)" />
            <text className="trophy-emoji" x={CX} y={CY + 6} textAnchor="middle" dominantBaseline="central" fontSize="64">🏆</text>
            {champion ? (
              <g className="champ-banner" key={champion}>
                <text x={CX} y={CY + 62} textAnchor="middle" fontSize="26">{flagOf(champion)}</text>
                <text x={CX} y={CY + 86} textAnchor="middle" fontSize="13" fontWeight="800" fill={finalM.winner ? "#ffc94d" : "#4d8dff"} letterSpacing="2">
                  {finalM.winner ? "CHAMPIONS" : "YOUR PICK"}
                </text>
              </g>
            ) : (
              <text x={CX} y={CY + 74} textAnchor="middle" fontSize="12" fontWeight="700" fill="#5c6685" letterSpacing="3">JULY 19</text>
            )}
          </g>
        </svg>
        {tip && (
          <div className="rtip" style={{ left: `${tip.x / 10}%`, top: `${tip.y / 10}%` }}>
            <b>{tip.title}</b>
            <span className="sub2">{tip.sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassicGrid({ bracket, predictions, favorite, selected, mode, clickTeam }) {
  const highlight = useMemo(
    () => (selected ? new Set(pathToFinal(selected, bracket)) : new Set()),
    [selected, bracket]
  );
  return (
    <>
      <div className="bracket-scroll">
        <div className="bracket">
          {ROUNDS.map((round) => (
            <div className="bcol" key={round.key}>
              <h5>{round.label}</h5>
              <div className="bcol-inner">
                {round.matches.map((m) => {
                  const rm = bracket[m.id];
                  const played = !!rm.winner;
                  const onpath = highlight.has(m.id);
                  const renderTeam = (code, score, isWinner, isPredictedEntry) => (
                    <button
                      className={[
                        "bteam",
                        code ? "clickable" : "tbd",
                        played && code ? (isWinner ? "winner" : "loser") : "",
                        !played && predictions[m.id] === code && code ? "predicted" : "",
                        isPredictedEntry ? "predicted" : "",
                        favorite === code ? "fav" : "",
                      ].join(" ")}
                      onClick={() => clickTeam(rm, code)}
                      disabled={!code}
                    >
                      <span>{code ? flagOf(code) : "·"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {code ? nameOf(code) : "TBD"}
                      </span>
                      {favorite === code && code && <Star size={10} fill="currentColor" />}
                      {isPredictedEntry && <span className="pred-tag">PICK</span>}
                      {!played && !isPredictedEntry && predictions[m.id] === code && code && <span className="pred-tag">PICK</span>}
                      {(played || rm.live) && <span className="bscore">{score}</span>}
                    </button>
                  );
                  return (
                    <div className={`bmatch ${onpath ? "onpath" : ""}`} key={m.id}>
                      {renderTeam(rm.home, rm.hs, rm.winner === rm.home, rm.homePredicted)}
                      {renderTeam(rm.away, rm.as, rm.winner === rm.away, rm.awayPredicted)}
                      {rm.pens && <div className="pens-note">Pens {rm.pens} — {nameOf(rm.winner)} advance</div>}
                      {rm.aet && !rm.pens && rm.winner && <div className="pens-note">After extra time</div>}
                      <div className="bmeta">
                        {rm.live && <span className="live-tag"><span className="live-dot" /> LIVE {rm.live.clock}</span>}
                        {!played && !rm.live && rm.kickoff && <><Clock size={9} />{fmtLocal(rm.kickoff)}{rm.timeTBC && " ※"}</>}
                        {rm.venue && <><MapPin size={9} />{rm.venue.split(",")[0]}{rm.tbc && " ※"}</>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Bracket({ bracket, predictions, setPredictions, favorite, selected, setSelected }) {
  const [layout, setLayout] = useState("orbit"); // orbit | classic
  const [mode, setMode] = useState("explore"); // explore | predict
  const clickTeam = useBracketClick(mode, selected, setSelected, setPredictions);
  return (
    <>
      <div className="bracket-tools">
        <div className="layout-toggle" role="tablist" aria-label="Bracket layout">
          <button className={layout === "orbit" ? "on" : ""} onClick={() => setLayout("orbit")}><CircleDot size={13} /> Orbit</button>
          <button className={layout === "classic" ? "on" : ""} onClick={() => setLayout("classic")}><Calendar size={13} /> Classic</button>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Bracket mode">
          <button className={mode === "explore" ? "on" : ""} onClick={() => setMode("explore")}><Eye size={13} /> Explore</button>
          <button className={mode === "predict" ? "on" : ""} onClick={() => setMode("predict")}><MousePointerClick size={13} /> Predict</button>
        </div>
        <span>
          {mode === "explore"
            ? "Click any flag to light up that team's road to the trophy."
            : "Click winners in unplayed matches — your picks fill the inner rings."}
        </span>
        {Object.keys(predictions).length > 0 && (
          <button className="clear-btn" onClick={() => setPredictions({})}>Clear predictions</button>
        )}
      </div>
      {layout === "orbit" ? (
        <RadialBracket
          bracket={bracket}
          predictions={predictions}
          favorite={favorite}
          selected={selected}
          onTeamClick={clickTeam}
        />
      ) : (
        <ClassicGrid
          bracket={bracket}
          predictions={predictions}
          favorite={favorite}
          selected={selected}
          mode={mode}
          clickTeam={clickTeam}
        />
      )}
      <div className="note-line" style={{ maxWidth: 720 }}>
        <Info size={13} style={{ flex: "none", marginTop: 2 }} />
        Blue-ringed flags are your predictions, not results — hover any flag for score, date and venue. ※ = pairing not yet officially confirmed. Quarter-final onward venues shown per the official schedule.
      </div>
    </>
  );
}

function StatsPanel() {
  const { live } = useTour();
  const { scorers, assists, cleanSheets } = live;
  const [tab, setTab] = useState("goals");
  const [sort, setSort] = useState({ key: null, dir: -1 });
  const tabs = [
    { id: "goals", label: "Top scorers", icon: Target },
    { id: "assists", label: "Assists", icon: Zap },
    { id: "cs", label: "Clean sheets", icon: Shield },
    { id: "cards", label: "Cards", icon: AlertTriangle },
    { id: "poss", label: "Possession", icon: CircleDot },
  ];
  const sortRows = (rows, defKey) => {
    const key = sort.key ?? defKey;
    return [...rows].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (typeof av === "string") return sort.dir * av.localeCompare(bv);
      return sort.dir * (av - bv);
    });
  };
  const th = (label, key) => (
    <th onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }))}>
      {label}{sort.key === key ? (sort.dir === -1 ? " ↓" : " ↑") : ""}
    </th>
  );
  const chartData = scorers.slice(0, 8).map((s) => ({ name: s.player.split(" ").slice(-1)[0], goals: s.goals }));
  return (
    <>
      <div className="stats-tabs">
        {tabs.map(({ id, label, icon: I }) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => { setTab(id); setSort({ key: null, dir: -1 }); }}>
            <I size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{label}
          </button>
        ))}
      </div>

      {tab === "goals" && (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#8b96b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5c6685", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip cursor={{ fill: "rgba(148,163,255,.06)" }} contentStyle={{ background: "#101827", border: "1px solid rgba(148,163,255,.22)", borderRadius: 10, color: "#eef2ff" }} />
                <Bar dataKey="goals" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {chartData.map((_, i) => <Cell key={i} fill={i < 2 ? "#2de38a" : i < 5 ? "#4d8dff" : "#2a3a5e"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="stat-table">
            <thead><tr><th>#</th>{th("Player", "player")}{th("Team", "team")}{th("Goals", "goals")}</tr></thead>
            <tbody>
              {sortRows(scorers, "goals").map((s, i) => (
                <tr key={s.player}>
                  <td style={{ color: "var(--muted2)", fontWeight: 700 }}>{i + 1}</td>
                  <td>{s.player}{s.unverified && " ※"}</td>
                  <td>{flagOf(s.team)} {nameOf(s.team)}</td>
                  <td className="num">{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note-line"><Info size={13} style={{ flex: "none", marginTop: 2 }} /> {live.scorersNote} Data as of {live.asOf}.</div>
        </>
      )}

      {tab === "assists" && (
        <>
          <table className="stat-table">
            <thead><tr><th>#</th>{th("Player", "player")}{th("Team", "team")}{th("Assists", "assists")}</tr></thead>
            <tbody>
              {sortRows(assists, "assists").map((s, i) => (
                <tr key={s.player}>
                  <td style={{ color: "var(--muted2)", fontWeight: 700 }}>{i + 1}</td>
                  <td>{s.player}{s.unverified && " ※"}</td>
                  <td>{flagOf(s.team)} {nameOf(s.team)}</td>
                  <td className="num">{s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note-line"><Info size={13} style={{ flex: "none", marginTop: 2 }} /> Only leaders confirmed by multiple outlets are listed. ※ Guimarães is reported second but his exact count wasn't verified at build time.</div>
        </>
      )}

      {tab === "cs" && (
        <>
          <table className="stat-table">
            <thead><tr><th>#</th>{th("Goalkeeper", "player")}{th("Team", "team")}{th("Clean sheets", "cs")}</tr></thead>
            <tbody>
              {sortRows(cleanSheets, "cs").map((s, i) => (
                <tr key={s.player}>
                  <td style={{ color: "var(--muted2)", fontWeight: 700 }}>{i + 1}</td>
                  <td>{s.player}<div style={{ fontSize: 12, color: "var(--muted)" }}>{s.note}</div></td>
                  <td>{flagOf(s.team)} {nameOf(s.team)}</td>
                  <td className="num">{s.cs}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note-line"><Info size={13} style={{ flex: "none", marginTop: 2 }} /> Shutout counts include group stage and knockout rounds. Full goalkeeping stats: FIFA.com. Data as of {live.asOf}.</div>
        </>
      )}

      {(tab === "cards" || tab === "poss") && (
        <div className="empty-tab">
          <AlertTriangle size={22} style={{ color: "var(--gold)", marginBottom: 8 }} />
          <div>
            {tab === "cards" ? "Disciplinary" : "Possession"} leaders weren't verifiable from live sources when this dashboard
            was last updated ({live.asOf}), and we don't show unverified numbers.
          </div>
          <div style={{ marginTop: 6 }}>
            Live figures: <b style={{ color: "var(--text)" }}>fifa.com → Tournament Statistics</b>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================ app ============================ */

export default function App() {
  const [view, setView] = useState("groups"); // groups | bracket | stats
  const [favorite, setFavoriteState] = useState(() => localStorage.getItem("wc26-fav") || null);
  const [predictions, setPredictionsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wc26-predictions")) || {}; } catch { return {}; }
  });
  const [panelTeam, setPanelTeam] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedBracketTeam, setSelectedBracketTeam] = useState(null);

  const setFavorite = useCallback((c) => {
    setFavoriteState(c);
    if (c) localStorage.setItem("wc26-fav", c); else localStorage.removeItem("wc26-fav");
  }, []);
  const setPredictions = useCallback((updater) => {
    setPredictionsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("wc26-predictions", JSON.stringify(next));
      return next;
    });
  }, []);

  const { live, lastSync, source } = useLiveData();
  const tour = useMemo(() => buildTournament(live), [live]);
  const bracket = useBracket(tour.byId, predictions);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return tour.merged
      .filter((m) => !m.winner && m.kickoff && new Date(m.kickoff).getTime() > now - 3 * 3600000)
      .map((m) => ({ ...bracket[m.id] }))
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
      .slice(0, 8);
  }, [tour, bracket]);

  const nextMatch =
    upcoming.find((m) => m.live) ||
    upcoming.find((m) => m.home && m.away && new Date(m.kickoff) > new Date()) ||
    upcoming[0];

  const roundLabelOf = (id) => ROUNDS.find((r) => r.matches.some((m) => m.id === id))?.label;

  // close overlays with Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setPanelTeam(null); setPreview(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TourCtx.Provider value={tour}>
    <div className="app">
      <style>{CSS}</style>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-eyebrow"><Trophy size={15} /> FIFA World Cup 26</div>
            <h1>World Cup <span className="grad">2026</span></h1>
            <div className="hero-hosts">🇨🇦 Canada · 🇲🇽 Mexico · 🇺🇸 United States — June 11 → July 19</div>
            <div className="stage-pill"><span className="dot" /> {live.stage}</div>
            <div className="sync-pill">
              <RefreshCw size={11} className={lastSync ? "spin-slow" : ""} />
              {lastSync
                ? <>
                    {source === "espn" ? "ESPN live feed" : "Local data (ESPN unreachable)"} · refreshes every 5s ·
                    updated {lastSync.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                  </>
                : "Connecting to live data…"}
            </div>
          </div>
          {nextMatch && <Countdown match={nextMatch} round={roundLabelOf(nextMatch.id)} />}
        </div>
        <div className="hero-scorers">
          <h3><Flame size={14} /> Golden Boot race</h3>
          <div className="scorer-row">
            {live.scorers.slice(0, 5).map((s, i) => (
              <div className="scorer-card stagger" style={{ animationDelay: `${0.15 + i * 0.08}s` }} key={s.player}>
                <div className="rank">#{i + 1}</div>
                <div className="sc-name">{s.player}</div>
                <div className="sc-team">{flagOf(s.team)} {nameOf(s.team)}</div>
                <div className="sc-goals">{s.goals}<small>goals</small></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- UPCOMING STRIP ---------- */}
      <div className="section-h"><Calendar className="icn" size={18} /><h2>Upcoming matches</h2><span style={{ color: "var(--muted2)", fontSize: 12 }}>times shown in your timezone</span></div>
      <div className="strip">
        {upcoming.map((m, i) => (
          <div className="fix-card stagger" style={{ animationDelay: `${0.1 + i * 0.07}s` }} key={m.id}>
            <div className="fix-round">
              {roundLabelOf(m.id)}
              {m.live && <span className="live-tag"><span className="live-dot" /> LIVE {m.live.clock}</span>}
            </div>
            <div className="fix-teams">
              {[m.home, m.away].map((c, i) => (
                <div className={`fix-team ${favorite === c ? "fav" : ""}`} key={i}>
                  <span>{c ? flagOf(c) : "·"}</span>
                  <span>{c ? nameOf(c) : "Winner TBD"}</span>
                  {(i === 0 ? m.homePredicted : m.awayPredicted) && <span className="pred-tag">PICK</span>}
                  {m.live && <b style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{i === 0 ? m.hs : m.as}</b>}
                </div>
              ))}
            </div>
            <div className="fix-meta">
              {m.live
                ? <span><Zap size={12} /> {m.live.detail ?? "In play"}</span>
                : <span><Clock size={12} /> {fmtLocal(m.kickoff)}{m.timeTBC && " ※ TBC"}</span>}
              {m.venue && <span><MapPin size={12} /> {m.venue}</span>}
            </div>
            {m.home && m.away && (
              <button className="preview-btn" onClick={() => setPreview(m)}>
                Match preview <ChevronRight size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ---------- VIEW NAV ---------- */}
      <nav className="viewnav" aria-label="Dashboard views">
        {[["groups", "Group stage"], ["bracket", "Knockout bracket"], ["stats", "Stats"]].map(([id, label]) => (
          <button key={id} className={view === id ? "on" : ""} onClick={() => setView(id)}>{label}</button>
        ))}
      </nav>

      <div className="view-anim" key={view}>
        {view === "groups" && <GroupsView onTeam={setPanelTeam} favorite={favorite} />}
        {view === "bracket" && (
          <Bracket
            bracket={bracket}
            predictions={predictions}
            setPredictions={setPredictions}
            favorite={favorite}
            selected={selectedBracketTeam}
            setSelected={setSelectedBracketTeam}
          />
        )}
        {view === "stats" && <StatsPanel />}
      </div>

      {panelTeam && (
        <TeamPanel
          code={panelTeam}
          onClose={() => setPanelTeam(null)}
          favorite={favorite}
          setFavorite={setFavorite}
          bracket={bracket}
        />
      )}
      {preview && <PreviewModal match={preview} onClose={() => setPreview(null)} />}

      <footer className="foot">
        Scores, fixtures and live match states stream from ESPN's public scoreboard API every 5 seconds, with
        <code> live.json</code> (last compiled {live.asOf}) as fallback and as the source for scorer/stat tables.
        Items marked ※ could not be fully verified. This is a fan dashboard — not affiliated with FIFA or ESPN.
      </footer>
    </div>
    </TourCtx.Provider>
  );
}

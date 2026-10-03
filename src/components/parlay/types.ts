import type { Game, Pick } from "#shared/parlay/model";

/** Response and request shapes for /api/parlay (mirrors the Worker route). */

export type Result = "pending" | "won" | "lost" | "push" | "void" | "review";

export interface OddsEstimate {
  odds: number;
  source: string;
  url: string;
  method: string;
  confidence: "medium" | "low";
}

/** A saved pick, optionally decorated with a historical price estimate. */
export type SavedPick = Pick & { oddsEstimate?: OddsEstimate };

export interface PickRow {
  id: string;
  season: number;
  week: number;
  team_id: number;
  pick: SavedPick;
  result: Result;
  actual: string | null;
  updated: number;
}

export interface LeagueTeam {
  id: number;
  ownerKey: string;
  personName: string | null;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  rank: number;
}

export interface MatchupSide {
  id: number;
  score: number;
}

export interface Matchup {
  id: number;
  week: number;
  home: MatchupSide | null;
  away: MatchupSide | null;
}

export interface League {
  teams: LeagueTeam[];
  matchups: Matchup[];
  week: number | null;
  updated: number | null;
  stale: boolean;
  error?: string;
  previousSeasons?: number[];
  scoringPeriod?: number;
  latestComplete?: number;
  periods?: Record<string, number[]>;
}

export interface Funder {
  ids: number[];
  score: number;
  tie: boolean;
  names: string;
}

export interface Member {
  name: string;
  team_id: number;
  email?: string;
}

export interface HistoryRow {
  season: number;
  week: number;
  team_id: number;
  result: Result;
}

export interface LowFinishLeader {
  name: string;
  lowWeeks: number;
  ties: number;
  lowest: number;
}

export interface AllTime {
  leaders: LowFinishLeader[];
  weeks: number;
  seasons: number[];
  unavailable: number[];
}

export interface TimelinePoint {
  season: number;
  week: number;
  label: string;
  result: Result;
  pick: SavedPick;
  odds: number | null;
  estimated: boolean;
  delta: number | null;
  units: number | null;
  netWins: number | null;
}

export interface PerformanceRecord {
  key: string;
  name: string;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  pending: number;
  priced: number;
  missingOdds: number;
  estimated: number;
  units: number;
  netWins: number;
  timeline: TimelinePoint[];
  streak: number;
  streakResult: Result | null;
  longestWin: number;
  longestLoss: number;
  winRate: number | null;
  roi: number | null;
  averageUnits: number | null;
  averageDecimal: number | null;
}

export interface Performance {
  leaders: PerformanceRecord[];
  estimatedLeaders: PerformanceRecord[];
  seasons: number[];
  picks: number;
  unavailable: number[];
}

export interface ClubhouseData {
  allTime: AllTime | null;
  performance: Performance | null;
  availableSeasons: number[];
  season: number;
  week: number;
  activeWeek: number;
  league: League;
  games: Game[];
  scheduleError: string;
  picks: PickRow[];
  deadline: number;
  locked: boolean;
  funder: Funder | null;
  members: Member[];
  history: HistoryRow[];
  user: { name: string; admin: boolean; teamId: number | null };
  connections: { espn: boolean; odds: boolean };
  credits: number;
}

export interface OddsOption {
  player?: string;
  side: string;
  line?: number | null;
  odds: number;
  book?: string;
  source?: string;
  sourceTime?: number;
}

export interface OddsData {
  book: string | null;
  updated: number;
  options: OddsOption[];
  message?: string | null;
  cached?: boolean;
  stale?: boolean;
}

/** Body of a `pick` action (before the server adds game/kickoff/settlement). */
export interface PickInput {
  eventId: string;
  market: string;
  player: string;
  side: string;
  line: number | null;
  odds: number;
  book: string;
  source: "feed" | "manual";
  sourceTime: number;
  note?: string;
}

export interface WeekContext {
  season: number;
  week: number;
}

export type ParlayAction =
  | { action: "pick"; team: string; pick: PickInput }
  | { action: "deletePick"; team: string }
  | { action: "grade"; id: string; result: Result; reason: string };

export type { Game, Pick };

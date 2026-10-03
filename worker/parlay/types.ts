/**
 * Shapes for data the parlay backend reads from ESPN, The Odds API and D1.
 * Provider payloads are only typed for the fields we actually read.
 */

// ---------- League (ESPN fantasy) ----------

export interface LeagueTeam {
  id: number;
  /** Sorted ESPN owner ids joined with "|" — stable across seasons for the same person. */
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

export interface LeagueData {
  peopleVersion?: number;
  previousSeasons?: number[];
  teams: LeagueTeam[];
  matchups: Matchup[];
  week: number | null;
  scoringPeriod?: number;
  latestComplete?: number;
  periods?: Record<string, number[]>;
}

export interface LeagueState extends LeagueData {
  updated: number | null;
  stale: boolean;
  error?: string;
}

export interface EspnLeagueResponse {
  members?: { id: string; firstName?: string; lastName?: string; displayName?: string }[];
  teams?: {
    id: number;
    owners?: string[];
    name?: string;
    location?: string;
    nickname?: string;
    record?: { overall?: { wins?: number; losses?: number; ties?: number; pointsFor?: number } };
    rankCalculatedFinal?: number;
    playoffSeed?: number;
  }[];
  schedule?: {
    id: number;
    matchupPeriodId: number;
    home?: { teamId: number; totalPoints: number };
    away?: { teamId: number; totalPoints: number };
  }[];
  status?: {
    previousSeasons?: unknown[];
    currentMatchupPeriod?: number;
    scoringPeriodId?: number;
    latestScoringPeriod?: number;
  };
  scoringPeriodId?: number;
  settings?: { scheduleSettings?: { matchupPeriods?: Record<string, number[]> } };
}

// ---------- NFL scoreboard / box score (ESPN site API) ----------

export interface EspnCompetitor {
  id?: string | number;
  homeAway?: string;
  score?: string | number;
  team?: { id?: string | number; displayName?: string };
}

export interface EspnEvent {
  id: string;
  shortName?: string;
  date: string;
  status?: { type?: { completed?: boolean; shortDetail?: string } };
  competitions?: { competitors?: EspnCompetitor[] }[];
}

export interface EspnScoreboard {
  events?: EspnEvent[];
}

export interface EspnAthleteRow {
  athlete?: { id?: string | number; displayName?: string };
  stats?: unknown[];
}

export interface EspnStatGroup {
  name?: string;
  keys?: string[];
  names?: string[];
  labels?: string[];
  athletes?: EspnAthleteRow[];
}

export interface EspnTeamBox {
  team?: { id?: string | number };
  statistics?: EspnStatGroup[];
}

export interface EspnScoringPlay {
  type?: { id?: string | number };
  scoringType?: { name?: string };
  team?: { id?: string | number };
  homeScore?: number;
  awayScore?: number;
}

export interface EspnSummary {
  header?: {
    id?: string | number;
    competitions?: { status?: { type?: { completed?: boolean } }; competitors?: EspnCompetitor[] }[];
  };
  boxscore?: { players?: EspnTeamBox[] };
  scoringPlays?: EspnScoringPlay[];
}

export interface EspnRoster {
  athletes?: { items?: { id?: string | number; displayName?: string }[] }[];
}

// ---------- D1 rows ----------

export interface PickRow {
  id: string;
  season: number;
  week: number;
  team_id: number;
  user_id: string;
  data: string;
  result: string;
  actual: string | null;
  updated: number;
}

export interface MemberRow {
  email?: string;
  name: string;
  team_id: number;
}

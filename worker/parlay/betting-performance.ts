import type { PickWithEstimate } from "./historical-odds";
import type { LeagueData } from "./types";

export type PerformancePick = { season: number; week: number; team_id: number; result: string; data: string };

export interface TimelinePoint {
  season: number;
  week: number;
  label: string;
  result: string;
  pick: Partial<PickWithEstimate>;
  odds: number | null;
  estimated: boolean;
  delta: number | null;
  units: number | null;
  netWins: number | null;
}

interface Accumulator {
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
  decimalSum: number;
  netWins: number;
  timeline: TimelinePoint[];
  streak: number;
  streakResult: string | null;
  longestWin: number;
  longestLoss: number;
}

export type PerformanceRecord = Omit<Accumulator, "decimalSum"> & {
  winRate: number | null;
  roi: number | null;
  averageUnits: number | null;
  averageDecimal: number | null;
};

const valid = (odds: unknown): odds is number =>
  typeof odds === "number" && Number.isFinite(odds) && Math.abs(odds) >= 100 && Math.abs(odds) <= 1000000;

type LeagueTeams = Pick<LeagueData, "teams"> | undefined;

export function bettingRecords(
  rows: PerformancePick[],
  leagues: Map<number, LeagueTeams>,
  includeEstimates = false,
): PerformanceRecord[] {
  const people = new Map<string, Accumulator>();
  for (const row of [...rows].sort((a, b) => a.season - b.season || a.week - b.week)) {
    const team = leagues.get(row.season)?.teams?.find((t) => t.id === row.team_id);
    const key = team?.ownerKey || `${row.season}:${row.team_id}`;
    const p: Accumulator = people.get(key) || {
      key,
      name: team?.personName || team?.name || `Team ${row.team_id} (${row.season})`,
      wins: 0,
      losses: 0,
      pushes: 0,
      voids: 0,
      pending: 0,
      priced: 0,
      missingOdds: 0,
      estimated: 0,
      units: 0,
      decimalSum: 0,
      netWins: 0,
      timeline: [],
      streak: 0,
      streakResult: null,
      longestWin: 0,
      longestLoss: 0,
    };
    p.name = team?.personName || team?.name || p.name;
    if (row.result === "won") p.wins++;
    else if (row.result === "lost") p.losses++;
    else if (row.result === "push") p.pushes++;
    else if (row.result === "void") p.voids++;
    else p.pending++;
    let pick: Partial<PickWithEstimate>;
    try {
      pick = JSON.parse(row.data);
    } catch {
      pick = {};
    }
    const confirmedOdds = valid(pick.odds) ? pick.odds : null;
    const estimateOdds = pick.oddsEstimate?.odds;
    const confirmed = confirmedOdds !== null,
      estimated = !confirmed && includeEstimates && valid(estimateOdds),
      odds: number | null = confirmed ? confirmedOdds : estimated ? (estimateOdds as number) : null;
    const settled = row.result === "won" || row.result === "lost";
    let delta: number | null = null;
    if (settled) {
      p.netWins += row.result === "won" ? 1 : -1;
      if (odds !== null) {
        p.priced++;
        p.estimated += estimated ? 1 : 0;
        p.decimalSum += odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
        delta = row.result === "lost" ? -1 : odds > 0 ? odds / 100 : 100 / Math.abs(odds);
        p.units += delta;
      } else p.missingOdds++;
    }
    const last = p.timeline.at(-1),
      consecutive = last && last.season === row.season && last.week + 1 === row.week;
    if (settled) {
      p.streak = consecutive && p.streakResult === row.result ? p.streak + 1 : 1;
      p.streakResult = row.result;
      if (row.result === "won") p.longestWin = Math.max(p.longestWin, p.streak);
      else p.longestLoss = Math.max(p.longestLoss, p.streak);
    } else {
      p.streak = 0;
      p.streakResult = null;
    }
    p.timeline.push({
      season: row.season,
      week: row.week,
      label: `${row.season} W${row.week}`,
      result: row.result,
      pick,
      odds,
      estimated,
      delta,
      units: delta === null ? null : p.units,
      netWins: settled ? p.netWins : null,
    });
    people.set(key, p);
  }
  return [...people.values()].map(({ decimalSum, ...p }) => ({
    ...p,
    winRate: p.wins + p.losses ? (p.wins / (p.wins + p.losses)) * 100 : null,
    roi: p.priced ? (p.units / p.priced) * 100 : null,
    averageUnits: p.priced ? p.units / p.priced : null,
    averageDecimal: p.priced ? decimalSum / p.priced : null,
  }));
}

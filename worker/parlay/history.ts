import type { AppEnv } from "../env";
import { bettingRecords, type PerformancePick, type PerformanceRecord } from "./betting-performance";
import { league, seasonNow } from "./espn";
import { withHistoricalEstimate } from "./historical-odds";
import type { LeagueState } from "./types";

export interface LowFinish {
  season: number;
  week: number;
  score: number;
  tie: boolean;
  people: { key: string; name: string }[];
}

// A low-score finish is not proof that someone actually placed or paid for a bet.
export function lowFinishes(l: LeagueState, season: number): LowFinish[] {
  const records: LowFinish[] = [];
  const weeks = [...new Set<number>(l.matchups.map((m) => m.week))];
  for (const week of weeks) {
    const periods = l.periods?.[String(week)];
    if (
      periods?.length !== 1 ||
      !Number.isFinite(l.scoringPeriod) ||
      Math.max(...periods) >= (l.scoringPeriod as number)
    )
      continue;
    const scores = new Map<number, number>();
    for (const m of l.matchups.filter((m) => m.week === week))
      for (const t of [m.home, m.away]) if (t && Number.isFinite(t.score)) scores.set(t.id, t.score);
    if (!l.teams.length || scores.size !== l.teams.length || [...scores.values()].every((s) => s === 0)) continue;
    const low = Math.min(...scores.values()),
      ids = [...scores].filter(([, s]) => s === low).map(([id]) => id);
    records.push({
      season,
      week,
      score: low,
      tie: ids.length > 1,
      people: ids.map((id) => {
        const t = l.teams.find((t) => t.id === id);
        return { key: t?.ownerKey || season + ":" + id, name: t?.personName || t?.name || "Team " + id };
      }),
    });
  }
  return records;
}

export interface AllTimeLeader {
  name: string;
  lowWeeks: number;
  ties: number;
  lowest: number;
}

export interface AllTime {
  leaders: AllTimeLeader[];
  weeks: number;
  seasons: number[];
  unavailable: number[];
}

export async function allTime(env: AppEnv, current: LeagueState): Promise<AllTime> {
  const year = seasonNow(),
    years = [year, ...(current.previousSeasons || [])].sort((a, b) => b - a);
  const leagues = await Promise.all(
    years.map(async (y) => ({ year: y, data: y === year ? current : await league(env, y) })),
  );
  const records = leagues.flatMap((x) => lowFinishes(x.data, x.year));
  const people = new Map<string, AllTimeLeader>();
  for (const r of records)
    for (const p of r.people) {
      const row = people.get(p.key) || { name: p.name, lowWeeks: 0, ties: 0, lowest: r.score };
      row.lowWeeks++;
      row.ties += r.tie ? 1 : 0;
      row.lowest = Math.min(row.lowest, r.score);
      people.set(p.key, row);
    }
  return {
    leaders: [...people.values()].sort((a, b) => b.lowWeeks - a.lowWeeks || a.lowest - b.lowest),
    weeks: records.length,
    seasons: leagues.filter((x) => x.data.teams.length && !x.data.error).map((x) => x.year),
    unavailable: leagues.filter((x) => !x.data.teams.length || x.data.error).map((x) => x.year),
  };
}

export interface BettingPerformance {
  leaders: PerformanceRecord[];
  estimatedLeaders: PerformanceRecord[];
  seasons: number[];
  picks: number;
  unavailable: number[];
}

export async function bettingPerformance(env: AppEnv, current: LeagueState): Promise<BettingPerformance> {
  const rows = await env.DB.prepare(
    "SELECT season,week,team_id,result,data FROM picks ORDER BY season,week",
  ).all<PerformancePick>();
  const seasons = [...new Set<number>(rows.results.map((r) => r.season))];
  const leagues = new Map<number, LeagueState>(
    await Promise.all(
      seasons.map(
        async (year) => [year, year === seasonNow() ? current : await league(env, year)] as [number, LeagueState],
      ),
    ),
  );
  const enriched = rows.results.map((r) => {
    try {
      return { ...r, data: JSON.stringify(withHistoricalEstimate(r.season, r.week, r.team_id, JSON.parse(r.data))) };
    } catch {
      return r;
    }
  });
  return {
    leaders: bettingRecords(enriched, leagues),
    estimatedLeaders: bettingRecords(enriched, leagues, true),
    seasons: seasons.sort(),
    picks: rows.results.length,
    unavailable: seasons.filter((y) => !leagues.get(y)?.teams?.length || leagues.get(y)?.error),
  };
}

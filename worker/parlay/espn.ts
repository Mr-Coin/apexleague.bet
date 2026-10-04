import { type Game, type Pick, settle } from "#shared/parlay/model";
import { uniquePlayerId } from "#shared/parlay/provider-mapping";
import type { AppEnv } from "../env";
import { cached, putCache } from "./cache";
import scheduleBackup from "./schedule-backup.json" with { type: "json" };
import { makeRule, readPlayerStat } from "./settlement";
import type {
  EspnLeagueResponse,
  EspnRoster,
  EspnScoreboard,
  EspnSummary,
  LeagueData,
  LeagueState,
  LeagueTeam,
  PickRow,
} from "./types";

export class ProviderUnavailableError extends Error {}

export async function jsonFetch<T = unknown>(url: string, headers: Record<string, string> = {}): Promise<T> {
  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new ProviderUnavailableError("Data provider unavailable (" + r.status + ").");
    return (await r.json()) as T;
  } catch (e) {
    if (e instanceof ProviderUnavailableError) throw e;
    throw new ProviderUnavailableError("Data provider could not respond. Please retry.");
  }
}

const ESPN_HOSTS = ["site.api.espn.com", "site.web.api.espn.com"];

export async function espnJson<T = unknown>(path: string): Promise<T> {
  let failure: unknown;
  for (const host of ESPN_HOSTS) {
    try {
      return await jsonFetch<T>("https://" + host + path);
    } catch (e) {
      failure = e;
    }
  }
  throw failure;
}

export const verificationPending =
  "Saved · player verification pending. ESPN will be checked again when results are available.";

export async function bindPickForSave(env: AppEnv, p: Pick, season: number): Promise<Pick> {
  try {
    return await bindPick(env, p, season);
  } catch (e) {
    // Only external lookup failures may defer verification. Invalid picks and storage failures still fail.
    if (!p.market.startsWith("player_") || !(e instanceof ProviderUnavailableError)) throw e;
    return { ...p, settlement: undefined, verificationPending: true };
  }
}

export function seasonNow(): number {
  const d = new Date();
  return d.getUTCFullYear() - (d.getUTCMonth() < 2 ? 1 : 0);
}

const EMPTY_LEAGUE: LeagueData = { teams: [], matchups: [], week: null };

export async function league(env: AppEnv, season: number): Promise<LeagueState> {
  const key = "league:" + season,
    old = await cached<LeagueData>(env.DB, key);
  if (old && old.data.peopleVersion === 1 && Date.now() - old.updated < (season < seasonNow() ? 86400000 : 120000))
    return { ...old.data, updated: old.updated, stale: false };
  if (!env.ESPN_S2 || !env.ESPN_SWID)
    return {
      ...EMPTY_LEAGUE,
      updated: old?.updated || null,
      error: "Connect ESPN to load APEX scores.",
      ...(old?.data || {}),
      stale: !!old,
    };
  try {
    const d = await jsonFetch<EspnLeagueResponse>(
      "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/" +
        season +
        "/segments/0/leagues/" +
        encodeURIComponent(env.ESPN_LEAGUE_ID) +
        "?view=mTeam&view=mMatchupScore&view=mSettings",
      { Cookie: "espn_s2=" + env.ESPN_S2 + "; SWID=" + env.ESPN_SWID },
    );
    const people = new Map(
      (d.members || []).map((m) => [m.id, [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.displayName]),
    );
    const teams: LeagueTeam[] = (d.teams || []).map((t) => ({
      id: t.id,
      ownerKey: (t.owners || []).slice().sort().join("|") || "team:" + t.id,
      personName:
        (t.owners || [])
          .map((id) => people.get(id))
          .filter(Boolean)
          .join(" / ") || null,
      name: t.name || [t.location, t.nickname].filter(Boolean).join(" ") || "Team " + t.id,
      wins: t.record?.overall?.wins || 0,
      losses: t.record?.overall?.losses || 0,
      ties: t.record?.overall?.ties || 0,
      points: t.record?.overall?.pointsFor || 0,
      rank: t.rankCalculatedFinal || t.playoffSeed || 0,
    }));
    if (!teams.length) throw new Error("No teams returned");
    const data: LeagueData = {
      peopleVersion: 1,
      previousSeasons: (d.status?.previousSeasons || []).filter(
        (y): y is number => Number.isInteger(y) && (y as number) >= 2018 && (y as number) < season,
      ),
      teams,
      matchups: (d.schedule || []).map((m) => ({
        id: m.id,
        week: m.matchupPeriodId,
        home: m.home ? { id: m.home.teamId, score: m.home.totalPoints } : null,
        away: m.away ? { id: m.away.teamId, score: m.away.totalPoints } : null,
      })),
      week: d.status?.currentMatchupPeriod || d.scoringPeriodId || null,
      scoringPeriod: d.scoringPeriodId || d.status?.scoringPeriodId,
      latestComplete: d.status?.latestScoringPeriod,
      periods: d.settings?.scheduleSettings?.matchupPeriods || {},
    };
    await putCache(env.DB, key, data);
    return { ...data, updated: Date.now(), stale: false };
  } catch {
    return {
      ...(old?.data || EMPTY_LEAGUE),
      updated: old?.updated || null,
      stale: !!old,
      error: "ESPN could not refresh. Any saved scores are marked stale.",
    };
  }
}

function validScore(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseScore(value: unknown): number | undefined {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return undefined;
  const score = Number(value);
  return validScore(score) ? score : undefined;
}

function normalizeGames(d: EspnScoreboard, scheduleOnly = false): Game[] {
  return (d.events || []).map((e) => {
    const c = e.competitions?.[0],
      h = c?.competitors?.find((x) => x.homeAway === "home"),
      a = c?.competitors?.find((x) => x.homeAway === "away"),
      homeScore = parseScore(h?.score),
      awayScore = parseScore(a?.score),
      scoresUnavailable = scheduleOnly || homeScore === undefined || awayScore === undefined;
    return {
      id: e.id,
      name: e.shortName ?? "",
      home: h?.team?.displayName ?? "",
      away: a?.team?.displayName ?? "",
      date: e.date,
      completed: !scoresUnavailable && e.status?.type?.completed === true,
      state: scoresUnavailable ? "Schedule only · scores unavailable" : e.status?.type?.shortDetail || "Scheduled",
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      scheduleOnly: scoresUnavailable,
    };
  });
}

export async function games(db: D1Database, season: number, week: number): Promise<Game[]> {
  const key = "games:" + season + ":" + week,
    old = await cached<Game[]>(db, key);
  if (old && Date.now() - old.updated < 120000) return old.data;
  const path =
    "/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&dates=" + season + "&week=" + week + "&limit=100";
  for (const host of ESPN_HOSTS) {
    try {
      const d = await jsonFetch<EspnScoreboard>("https://" + host + path);
      const list = normalizeGames(d);
      if (!list.length) continue;
      await putCache(db, key, list);
      return list;
    } catch {
      /* Try the alternate ESPN host before using the last schedule. */
    }
  }
  if (old?.data?.length)
    return old.data.map((g) => ({
      ...g,
      completed: false,
      scheduleOnly: true,
      state: "Schedule only · scores unavailable",
    }));
  const backup = (scheduleBackup as Record<string, EspnScoreboard>)[season + ":" + week];
  if (backup) return normalizeGames(backup, true);
  throw new Error("NFL schedule is unavailable. Please try again shortly.");
}

export async function eventSummary(db: D1Database, eventId: string): Promise<EspnSummary> {
  const key = "box:" + eventId,
    old = await cached<EspnSummary>(db, key);
  if (old && Date.now() - old.updated < 300000) return old.data;
  const data = await espnJson<EspnSummary>(
    "/apis/site/v2/sports/football/nfl/summary?event=" + encodeURIComponent(eventId),
  );
  await putCache(db, key, data);
  return data;
}

export async function bindPick(env: AppEnv, p: Pick, season: number): Promise<Pick> {
  if (p.market === "custom") return p;
  let athleteId: string | undefined;
  if (p.market.startsWith("player_")) {
    const summary = await eventSummary(env.DB, p.eventId);
    if (String(summary.header?.id) !== p.eventId) throw new Error("ESPN could not verify this game. Please retry.");
    const competitors = summary.header?.competitions?.[0]?.competitors || [];
    if (competitors.length !== 2) throw new Error("ESPN rosters are unavailable. Please retry.");
    const rosters = await Promise.all(
      competitors.map(async (c) => {
        const key = "roster:" + season + ":" + c.id,
          old = await cached<EspnRoster>(env.DB, key);
        if (old && Date.now() - old.updated < 3600000) return old.data;
        const roster = await espnJson<EspnRoster>(
          "/apis/site/v2/sports/football/nfl/teams/" + encodeURIComponent(String(c.id)) + "/roster?season=" + season,
        );
        await putCache(env.DB, key, roster);
        return roster;
      }),
    );
    const players = rosters.flatMap((roster) =>
      (roster.athletes || []).flatMap((group) => (group.items || []).map((a) => ({ ...a, id: a.id?.toString() }))),
    );
    athleteId = uniquePlayerId(p.player, players);
    if (!athleteId)
      throw new Error(
        "Could not uniquely match this player to the game's ESPN rosters. Check the full name or use Other / manual review.",
      );
    // Preserve the submitted name; the verified ID is authoritative for settlement.
  }
  return { ...p, settlement: makeRule(p, athleteId) };
}

export async function playerStat(db: D1Database, eventId: string, p: Pick): Promise<number | undefined> {
  return readPlayerStat(await eventSummary(db, eventId), p);
}

export async function grade(db: D1Database, season: number, week: number, gs: Game[]): Promise<void> {
  const rows = await db
    .prepare("SELECT * FROM picks WHERE season=? AND week=? AND result='pending'")
    .bind(season, week)
    .all<PickRow>();
  for (const row of rows.results) {
    let p: Pick = JSON.parse(row.data);
    const g = gs.find((x) => x.id === p.eventId);
    const pending = async (reason: string) => {
      await db.prepare("UPDATE picks SET actual=? WHERE id=? AND result='pending'").bind(reason, row.id).run();
    };
    if (!g || g.scheduleOnly) {
      await pending("Waiting for ESPN game results; will retry.");
      continue;
    }
    // Team markets need both names to grade; an incomplete feed must stay pending rather than
    // fall through to settle()'s "Team mismatch" review.
    if ((p.market === "h2h" || p.market === "spreads") && (!g.home || !g.away)) {
      await pending("Waiting for ESPN team data; will retry.");
      continue;
    }
    // Cached/provider data must also be valid before score-based settlement.
    if (["h2h", "spreads", "totals"].includes(p.market) && (!validScore(g.homeScore) || !validScore(g.awayScore))) {
      await pending("Waiting for valid ESPN scores; will retry.");
      continue;
    }
    if (!g.completed) {
      await pending(p.verificationPending ? verificationPending : "Waiting for a final result · " + g.state);
      continue;
    }
    try {
      if (!p.settlement && p.market !== "custom") {
        // Deferred and legacy props resolve only against a unique athlete in this game's final box score.
        if (p.market.startsWith("player_")) {
          const data = await eventSummary(db, p.eventId);
          if (String(data.header?.id) !== p.eventId || !data.header?.competitions?.[0]?.status?.type?.completed) {
            await pending("Waiting for a verified final ESPN box score; will retry.");
            continue;
          }
          const players = (data.boxscore?.players || []).flatMap((t) =>
            (t.statistics || []).flatMap((group) =>
              (group.athletes || []).map((a) => ({
                id: a.athlete?.id?.toString(),
                displayName: a.athlete?.displayName,
              })),
            ),
          );
          const athleteId = uniquePlayerId(p.player, players);
          if (!athleteId) {
            await pending(
              "Player could not be uniquely verified in the final box score. Commissioner review may be needed.",
            );
            continue;
          }
          p = { ...p, settlement: makeRule(p, athleteId), verificationPending: false };
        } else p = { ...p, settlement: makeRule(p) };
      }
      const stat = p.market.startsWith("player_") ? await playerStat(db, g.id, p) : undefined;
      if (p.market.startsWith("player_") && stat === undefined) {
        await pending(
          p.market === "player_anytime_td"
            ? "Touchdown result or participation is unconfirmed. Commissioner review needed for sportsbook settlement."
            : "ESPN has no verified final stat for this player. Retrying; inactive-player voids need commissioner review.",
        );
        continue;
      }
      const result = settle(p, g, stat);
      if (result)
        await db
          .prepare("UPDATE picks SET data=?,result=?,actual=? WHERE id=? AND result='pending'")
          .bind(JSON.stringify(p), result.result, (p.market === "custom" ? "" : "ESPN: ") + result.actual, row.id)
          .run();
    } catch (e) {
      await pending(
        e instanceof ProviderUnavailableError
          ? e.message + " Player result will retry."
          : "ESPN could not refresh this result. Will retry.",
      );
    }
  }
}

export interface Funder {
  ids: number[];
  score: number;
  tie: boolean;
  names: string;
}

/** Previous week's lowest scorer funds this week's ticket, once that week has fully closed. */
export function funder(l: LeagueState, week: number): Funder | null {
  if (week <= 1 || l.week === null || week > l.week) return null;
  const previous = l.matchups.filter((m) => m.week === week - 1);
  const periods = l.periods?.[String(week - 1)];
  if (!periods?.length || !Number.isFinite(l.scoringPeriod) || Math.max(...periods) >= (l.scoringPeriod as number))
    return null;
  const scores = new Map<number, number>();
  for (const m of previous)
    for (const s of [m.home, m.away]) if (s && Number.isFinite(s.score)) scores.set(s.id, s.score);
  if (scores.size !== l.teams.length) return null;
  const low = Math.min(...scores.values()),
    ids = [...scores].filter(([, s]) => s === low).map(([id]) => id);
  return {
    ids,
    score: low,
    tie: ids.length > 1,
    names: ids
      .map((id) => l.teams.find((t) => t.id === id)?.personName || l.teams.find((t) => t.id === id)?.name)
      .join(" / "),
  };
}

import { Hono } from "hono";
import { z, ZodError } from "zod";
import { markets, type Pick as ParlayPick } from "#shared/parlay/model";
import { activeWeek, isThursday, pickDeadline, picksClosed } from "#shared/parlay/week";
import { assertSameOrigin, type AppContext, HttpError } from "../auth";
import type { AppEnv } from "../env";
import { bindPickForSave, funder, games, grade, league, seasonNow, verificationPending } from "./espn";
import { withHistoricalEstimate, type PickWithEstimate } from "./historical-odds";
import { allTime, bettingPerformance } from "./history";
import { oddsFor } from "./odds";
import { runSettlement } from "./settle";
import type { LeagueState, MemberRow, PickRow } from "./types";

/** What the API exposes for a saved pick: the row minus raw JSON and session id. */
export type PickView = Omit<PickRow, "data" | "user_id"> & { pick: PickWithEstimate };

interface Identity {
  userId: string;
  admin: boolean;
  fullName: string;
  displayName: string;
}

const SIGN_IN = "Sign in to view the parlay.";

/** Stu's route returned 400 with the thrown message for any failure; keep that contract. */
function clientError(e: unknown): never {
  if (e instanceof HttpError || e instanceof ZodError) throw e;
  throw new HttpError(400, e instanceof Error && e.message ? e.message : "Request could not be completed.");
}

/** ESPN owner keys are account GUIDs; expose only a stable one-way hash as the UI's row key. */
async function withPublicKey<T extends { key: string }>(record: T): Promise<T> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(record.key));
  const key = [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { ...record, key };
}

const contextSchema = z.object({
  season: z.coerce.number().int().min(2018).max(2100),
  week: z.coerce.number().int().min(1).max(18),
});

const pickSchema = z.object({
  eventId: z.string().min(1).max(30),
  market: z.string().refine((v) => !!markets[v]),
  player: z.string().max(100).default(""),
  side: z.string().min(1).max(200),
  line: z.number().finite().min(-10000).max(10000).nullable(),
  odds: z
    .number()
    .int()
    .refine((v) => Math.abs(v) >= 100 && Math.abs(v) <= 1000000),
  book: z.string().min(1).max(60),
  source: z.enum(["feed", "manual"]),
  sourceTime: z.number().finite(),
  note: z.string().max(300).optional(),
});

const memberSchema = z.object({
  email: z.email().max(200),
  name: z.string().min(1).max(80),
  teamId: z.number().int().positive(),
});

const gradeSchema = z.object({
  id: z.string(),
  result: z.enum(["won", "lost", "push", "void", "review", "pending"]),
  reason: z.string().min(3).max(200),
});

async function rows(env: AppEnv, season: number, week: number): Promise<PickView[]> {
  const r = await env.DB.prepare("SELECT * FROM picks WHERE season=? AND week=? ORDER BY updated")
    .bind(season, week)
    .all<PickRow>();
  return r.results.map(({ data, user_id: _userId, ...x }) => {
    const pick = withHistoricalEstimate(season, week, x.team_id, JSON.parse(data) as ParlayPick);
    return { ...x, pick, actual: x.actual || (pick.verificationPending ? verificationPending : null) };
  });
}

async function lockState(env: AppEnv, season: number, week: number) {
  return {
    picks: await rows(env, season, week),
    deadline: pickDeadline(season, week),
    locked: picksClosed(season, week),
  };
}

function manualTeam(value: unknown, l: LeagueState): number {
  const input = String(value ?? "").trim();
  const matches = l.teams.filter((t) => String(t.id) === input || t.name.toLowerCase() === input.toLowerCase());
  if (matches.length !== 1) throw new Error("Enter an APEX team name or ID from the scoreboard.");
  return matches[0].id;
}

export const parlayRoutes = new Hono<AppContext>();

parlayRoutes.use("*", async (c, next) => {
  if (!c.get("session")) throw new HttpError(401, SIGN_IN);
  await next();
});

function identity(c: { get: (k: "session") => AppContext["Variables"]["session"] }): Identity {
  const s = c.get("session")!;
  return { userId: s.sid, admin: s.role === "commissioner", fullName: "", displayName: "" };
}

parlayRoutes.get("/", async (c) => {
  try {
    const env = c.env,
      u = identity(c),
      q = new URL(c.req.url).searchParams,
      season = Number(q.get("season") || seasonNow());
    if (!Number.isInteger(season) || season < 2018 || season > 2100) throw new Error("Invalid season");
    const l = await league(env, season),
      week = Number(q.get("week") || activeWeek(season));
    contextSchema.parse({ season, week });
    let gs: Awaited<ReturnType<typeof games>> = [],
      scheduleError = "";
    try {
      gs = await games(env.DB, season, week);
    } catch (e) {
      scheduleError = e instanceof Error ? e.message : String(e);
    }
    if (q.get("action") === "odds") {
      const g = gs.find((x) => x.id === q.get("event"));
      if (!g || isThursday(g.date) || Date.parse(g.date) <= Date.now())
        throw new Error("Choose an upcoming non-Thursday game.");
      return c.json(await oddsFor(env, g, q.get("market") || "player_receptions"));
    }
    await grade(env.DB, season, week, gs);
    const [state, m, history, usage] = await Promise.all([
      lockState(env, season, week),
      env.DB.prepare(
        u.admin ? "SELECT email,name,team_id FROM members" : "SELECT name,team_id FROM members",
      ).all<MemberRow>(),
      env.DB.prepare("SELECT season,week,team_id,result FROM picks WHERE season=? ORDER BY week DESC")
        .bind(season)
        .all<Pick<PickRow, "season" | "week" | "team_id" | "result">>(),
      env.DB.prepare("SELECT credits FROM usage WHERE id=?")
        .bind(new Date().toISOString().slice(0, 7))
        .first<{ credits: number }>(),
    ]);
    const currentLeague = season === seasonNow() ? l : await league(env, seasonNow());
    const [stats, performance] =
      q.get("stats") === "1"
        ? await Promise.all([allTime(env, currentLeague), bettingPerformance(env, currentLeague)])
        : [null, null];
    return c.json({
      allTime: stats,
      performance: performance && {
        ...performance,
        leaders: await Promise.all(performance.leaders.map(withPublicKey)),
        estimatedLeaders: await Promise.all(performance.estimatedLeaders.map(withPublicKey)),
      },
      availableSeasons: [seasonNow(), ...(currentLeague.previousSeasons || [])],
      season,
      week,
      activeWeek: activeWeek(season),
      league: { ...l, teams: l.teams.map(({ ownerKey: _ownerKey, ...t }) => t) },
      games: gs,
      scheduleError,
      ...state,
      funder: funder(l, week),
      members: m.results,
      history: history.results,
      user: { name: u.fullName || u.displayName, admin: u.admin, teamId: null as number | null },
      connections: { espn: !!env.ESPN_S2 && !!env.ESPN_SWID, odds: !!env.ODDS_API_KEY },
      credits: usage?.credits || 0,
    });
  } catch (e) {
    clientError(e);
  }
});

parlayRoutes.post("/", async (c) => {
  try {
    assertSameOrigin(c.req.raw);
    const env = c.env,
      u = identity(c);
    if (Number(c.req.header("content-length") || 0) > 20000) throw new Error("Request is too large.");
    const b = (await c.req.json()) as Record<string, unknown>;
    if (b.action === "member") {
      if (!u.admin) throw new Error("Commissioner only.");
      const m = memberSchema.parse(b);
      const l = await league(env, seasonNow());
      if (!l.teams.some((t) => t.id === m.teamId)) throw new Error("Select a verified APEX team.");
      await env.DB.prepare(
        "INSERT INTO members(email,team_id,name) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET team_id=excluded.team_id,name=excluded.name",
      )
        .bind(m.email.toLowerCase(), m.teamId, m.name)
        .run();
      return c.json({ ok: true });
    }
    const ctx = contextSchema.parse(b),
      l = await league(env, ctx.season),
      state = await lockState(env, ctx.season, ctx.week);
    if (b.action === "pick" || b.action === "deletePick") {
      const teamId = manualTeam(b.team, l);
      if (ctx.season !== seasonNow() || activeWeek(ctx.season) !== ctx.week)
        throw new Error("Picks are only accepted for the active APEX week.");
      if (state.locked) throw new Error("Picks are locked at Sunday 1 p.m. Eastern.");
      const existing = state.picks.find((p) => p.team_id === teamId);
      if (existing && (existing.result !== "pending" || Date.parse(existing.pick.kickoff) <= Date.now()))
        throw new Error("This pick has started and cannot be changed or deleted.");
      if (b.action === "deletePick") {
        const deleted = await env.DB.prepare(
          "DELETE FROM picks WHERE season=? AND week=? AND team_id=? AND result='pending' AND ? > CAST(strftime('%s','now') AS INTEGER)*1000",
        )
          .bind(ctx.season, ctx.week, teamId, pickDeadline(ctx.season, ctx.week))
          .run();
        if (!deleted.meta.changes) throw new Error("Pick could not be deleted. It may be locked or already removed.");
        return c.json({ ok: true });
      }
      const p = pickSchema.parse(b.pick),
        gs = await games(env.DB, ctx.season, ctx.week),
        g = gs.find((x) => x.id === p.eventId);
      if (!g || isThursday(g.date) || Date.parse(g.date) <= Date.now())
        throw new Error("Choose an upcoming non-Thursday game in this week.");
      if (["h2h", "spreads"].includes(p.market) && ![g.home, g.away].includes(p.side))
        throw new Error("Select a team in this game.");
      if (p.market.startsWith("player_") && !p.player.trim()) throw new Error("Player name is required.");
      if (!["h2h", "player_anytime_td", "custom"].includes(p.market) && p.line === null)
        throw new Error("A line is required.");
      if (
        p.market !== "custom" &&
        !["h2h", "spreads", "player_anytime_td"].includes(p.market) &&
        !["Over", "Under"].includes(p.side)
      )
        throw new Error("Choose Over or Under.");
      if (p.market === "player_anytime_td" && p.side !== "Yes") throw new Error("Anytime touchdown picks must be Yes.");
      const duplicate = state.picks.find(
        (x) =>
          x.team_id !== teamId &&
          x.pick.eventId === p.eventId &&
          x.pick.market === p.market &&
          x.pick.player === p.player &&
          x.pick.side === p.side &&
          x.pick.line === p.line,
      );
      if (duplicate) throw new Error("That exact leg has already been selected.");
      const full = await bindPickForSave(env, { ...p, game: g.name, kickoff: g.date }, ctx.season);
      const saved = await env.DB.prepare(
        "INSERT INTO picks(id,season,week,team_id,user_id,data,updated) SELECT ?,?,?,?,?,?,? WHERE ? > CAST(strftime('%s','now') AS INTEGER)*1000 ON CONFLICT(season,week,team_id) DO UPDATE SET data=excluded.data,updated=excluded.updated,actual=NULL WHERE picks.result='pending'",
      )
        .bind(
          crypto.randomUUID(),
          ctx.season,
          ctx.week,
          teamId,
          u.userId,
          JSON.stringify(full),
          Date.now(),
          pickDeadline(ctx.season, ctx.week),
        )
        .run();
      if (!saved.meta.changes) throw new Error("The Sunday deadline has passed. Your pick was not changed.");
      return c.json({ ok: true, verificationPending: !!full.verificationPending });
    }
    if (b.action === "grade") {
      if (!u.admin) throw new Error("Commissioner only.");
      const g = gradeSchema.parse(b);
      await env.DB.prepare("UPDATE picks SET result=?,actual=? WHERE id=? AND season=? AND week=?")
        .bind(g.result, "Commissioner: " + g.reason, g.id, ctx.season, ctx.week)
        .run();
      return c.json({ ok: true });
    }
    throw new Error("Unknown action.");
  } catch (e) {
    clientError(e);
  }
});

parlayRoutes.get("/settle", (c) =>
  c.json({
    service: "APEX settlement",
    method: "POST",
    grading: "Deterministic ESPN results; no supplied grades accepted",
  }),
);

parlayRoutes.post("/settle", async (c) => {
  try {
    assertSameOrigin(c.req.raw);
  } catch {
    return c.json({ ok: false, error: "Settlement check failed; retry later." }, 503);
  }
  // This public trigger only applies provider results, never caller-supplied grades.
  const outcome = await runSettlement(c.env);
  return c.json(outcome.body, outcome.status);
});

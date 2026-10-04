import { afterAll, beforeEach, expect, it, vi } from "vitest";
import type { Game, Pick } from "#shared/parlay/model";
import { putCache } from "../../worker/parlay/cache";
import { games, grade } from "../../worker/parlay/espn";
import { fakeD1 } from "./fake-d1";
import { client, testEnv } from "./helpers";

const beforeKickoff = Date.parse("2026-09-27T13:29:59Z");
const kickoff = "2026-09-27T13:30:00Z";
let databaseNow = beforeKickoff;
const db = fakeD1(() => databaseNow);
const game: Game = {
  id: "early-game",
  name: "HOU @ IND",
  home: "Indianapolis Colts",
  away: "Houston Texans",
  date: kickoff,
  completed: true,
  state: "Final",
  homeScore: 0,
  awayScore: 21,
};
const pick: Pick = {
  eventId: game.id,
  game: game.name,
  kickoff,
  market: "h2h",
  player: "",
  side: game.home,
  line: null,
  odds: -110,
  book: "Manual",
  source: "manual",
  sourceTime: beforeKickoff,
};
function seed(p: Pick = pick) {
  db.sql
    .prepare("INSERT INTO picks(id,season,week,team_id,user_id,data,updated) VALUES(?,2026,3,901,?,?,?)")
    .run("saved", "test-user", JSON.stringify(p), beforeKickoff);
}
function saved() {
  return db.sql.prepare("SELECT data,result,actual FROM picks WHERE team_id=901").get();
}
beforeEach(async () => {
  databaseNow = beforeKickoff;
  vi.useFakeTimers({ now: beforeKickoff, toFake: ["Date"] });
  db.sql.exec("DELETE FROM picks; DELETE FROM cache;");
  vi.stubGlobal("fetch", async () => new Response("Forbidden", { status: 403 }));
  await putCache(db, "league:2026", { peopleVersion: 1, teams: [{ id: 901, name: "One" }], matchups: [], week: 3 });
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});

it.each([undefined, "", " ", "invalid", -1, 1.5])("keeps an invalid final score (%s) pending", async (score) => {
  seed();
  vi.stubGlobal("fetch", async () =>
    Response.json({
      events: [
        {
          id: game.id,
          date: kickoff,
          status: { type: { completed: true } },
          competitions: [
            {
              competitors: [
                { homeAway: "home", score, team: { displayName: game.home } },
                { homeAway: "away", score: "21", team: { displayName: game.away } },
              ],
            },
          ],
        },
      ],
    }),
  );
  await grade(db, 2026, 3, await games(db, 2026, 3));
  expect(saved()?.result).toBe("pending");
  expect(saved()?.actual).toMatch(/Waiting/);
});
it("accepts an explicit zero as a real final score", async () => {
  seed();
  await grade(db, 2026, 3, [game]);
  expect(saved()?.result).toBe("lost");
});
it.each(["h2h", "spreads", "totals"] as const)("defends %s grading against invalid cached scores", async (market) => {
  seed({ ...pick, market, side: market === "totals" ? "Over" : game.home, line: 3 });
  await grade(db, 2026, 3, [{ ...game, homeScore: Number.NaN }]);
  expect(saved()?.result).toBe("pending");
});

async function saveAcrossKickoff(replace: boolean) {
  const incoming = replace ? { ...game, id: "later-game", date: "2026-09-27T20:00:00Z" } : game;
  if (replace) seed();
  await putCache(db, "games:2026:3", [incoming]);
  const c = await client(testEnv(db));
  vi.stubGlobal("fetch", async () => {
    databaseNow = Date.parse(kickoff);
    vi.setSystemTime(databaseNow);
    return new Response("Forbidden", { status: 403 });
  });
  return c.post({
    action: "pick",
    season: 2026,
    week: 3,
    team: "901",
    pick: {
      ...pick,
      eventId: incoming.id,
      market: "player_receptions",
      player: "Josh Downs",
      side: "Over",
      line: 4.5,
    },
  });
}
it("blocks a new pick whose kickoff passes during provider lookup", async () => {
  expect((await saveAcrossKickoff(false)).status).toBe(400);
  expect(saved()).toBeUndefined();
});
it("blocks replacing a stored pick once its kickoff passes during lookup", async () => {
  expect((await saveAcrossKickoff(true)).status).toBe(400);
  expect(saved()?.data).toBe(JSON.stringify(pick));
});
it("checks the stored kickoff when the delete reaches the database", async () => {
  seed();
  const c = await client(testEnv(db));
  databaseNow = Date.parse(kickoff);
  expect((await c.post({ action: "deletePick", season: 2026, week: 3, team: "901" })).status).toBe(400);
  expect(saved()?.data).toBe(JSON.stringify(pick));
});
it("still permits deletion before kickoff", async () => {
  seed();
  const c = await client(testEnv(db));
  expect((await c.post({ action: "deletePick", season: 2026, week: 3, team: "901" })).status).toBe(200);
  expect(saved()).toBeUndefined();
});

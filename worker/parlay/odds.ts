import { type Game, markets } from "#shared/parlay/model";
import { type OddsEvent, oddsEventForGame, sameTeam } from "#shared/parlay/provider-mapping";
import type { AppEnv } from "../env";
import { cached, putCache } from "./cache";
import { jsonFetch } from "./espn";
import { type MarketOptions, marketOptions, oddsCacheTtl, type OddsEventResponse } from "./odds-market";

export type OddsResult = MarketOptions & { updated: number; cached?: boolean; stale?: boolean };

const MONTHLY_CREDIT_CAP = 450;

export async function oddsFor(env: AppEnv, g: Game, market: string): Promise<OddsResult> {
  if (!markets[market] || market === "custom") throw new Error("Choose a supported market.");
  const db = env.DB;
  const cacheKey = "odds:v2:" + g.id + ":" + market,
    old = await cached<MarketOptions>(db, cacheKey);
  // A book often posts props later than game lines. Never hide new props all day
  // because the first lookup happened before the market opened.
  if (old && Date.now() - old.updated < oddsCacheTtl(old.data))
    return { ...old.data, updated: old.updated, cached: true };
  const apiKey = env.ODDS_API_KEY;
  if (!apiKey) {
    if (old) return { ...old.data, updated: old.updated, stale: true };
    throw new Error("Odds feed needs a free API key. Manual picks are available.");
  }
  const month = new Date().toISOString().slice(0, 7);
  await db.prepare("INSERT OR IGNORE INTO usage(id,credits) VALUES(?,0)").bind(month).run();
  // One market / one region = one credit. Atomic reservation caps this site's usage.
  const reserved = await db
    .prepare("UPDATE usage SET credits=credits+1 WHERE id=? AND credits<? RETURNING credits")
    .bind(month, MONTHLY_CREDIT_CAP)
    .first<{ credits: number }>();
  if (!reserved) {
    if (old) return { ...old.data, updated: old.updated, stale: true };
    throw new Error("Monthly odds allowance reached. Please enter this pick manually.");
  }
  const eventCache = await cached<OddsEvent[]>(db, "odds-events");
  let events = eventCache?.data;
  if (!eventCache || !events || Date.now() - eventCache.updated > 3600000) {
    events = await jsonFetch<OddsEvent[]>(
      "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events?apiKey=" + encodeURIComponent(apiKey),
    );
    await putCache(db, "odds-events", events);
  }
  const e = oddsEventForGame(events, g);
  const data = await jsonFetch<OddsEventResponse>(
    "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/" +
      e.id +
      "/odds?apiKey=" +
      encodeURIComponent(apiKey) +
      "&regions=us&markets=" +
      market +
      "&oddsFormat=american",
  );
  if (data.id !== e.id || !sameTeam(data.home_team ?? "", g.home) || !sameTeam(data.away_team ?? "", g.away))
    throw new Error("The odds feed returned a different game. Please retry.");
  const out = marketOptions(data, market);
  if (["h2h", "spreads"].includes(market))
    out.options = out.options.map((o) => ({
      ...o,
      side: sameTeam(o.side, g.home) ? g.home : sameTeam(o.side, g.away) ? g.away : o.side,
    }));
  await putCache(db, cacheKey, out);
  return { ...out, updated: Date.now(), cached: false };
}

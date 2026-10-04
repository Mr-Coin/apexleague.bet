import type { SettlementRule } from "./settlement-rule";
export const markets: Record<string, string> = {
  h2h: "Moneyline",
  spreads: "Spread",
  totals: "Game total",
  player_pass_yds: "Passing yards",
  player_rush_yds: "Rushing yards",
  player_reception_yds: "Receiving yards",
  player_receptions: "Receptions",
  player_pass_tds: "Passing touchdowns",
  player_anytime_td: "Anytime touchdown",
  custom: "Other / manual review",
};
export type Game = {
  scheduleOnly?: boolean;
  id: string;
  name: string;
  home: string;
  away: string;
  date: string;
  completed: boolean;
  state: string;
  homeScore: number;
  awayScore: number;
};
export type Pick = {
  verificationPending?: boolean;
  settlement?: SettlementRule;
  eventId: string;
  game: string;
  kickoff: string;
  market: string;
  player: string;
  side: string;
  line: number | null;
  odds: number | null;
  book: string;
  source: string;
  sourceTime: number;
  note?: string;
};
export function decimal(odds: number | null) {
  return odds === null ? NaN : odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}
export function parlayResult(picks: { result: string }[]) {
  if (!picks.length) return "No picks";
  if (picks.some((p) => p.result === "lost")) return "Lost";
  if (picks.some((p) => !["won", "push", "void"].includes(p.result))) return "Pending";
  return picks.some((p) => p.result === "won") ? "Won" : "Push / void";
}
export function price(odds: number | null) {
  return odds === null ? "Odds unknown" : odds > 0 ? "+" + odds : String(odds);
}
export function pickLabel(p: Pick) {
  if (p.note?.includes("Ticket: Josh Downs 4+ receptions")) return "Josh Downs · 4+ receptions";
  return [p.player, p.side, p.line === null ? "" : p.line, markets[p.market] || p.market]
    .filter((x) => x !== "")
    .join(" · ");
}
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(jr|sr|iii|ii)$/, "");
}
export function compare(actual: number, line: number, side: string) {
  return actual === line ? "push" : (side === "Over" ? actual > line : actual < line) ? "won" : "lost";
}
export function settle(p: Pick, g: Game, stats?: number) {
  if (!g.completed) return null;
  if (p.market === "custom") return { result: "review", actual: "Manual review required" };
  if (p.market === "h2h" || p.market === "spreads") {
    const home = normalize(p.side) === normalize(g.home),
      away = normalize(p.side) === normalize(g.away);
    if (!home && !away) return { result: "review", actual: "Team mismatch" };
    const margin =
      (home ? g.homeScore - g.awayScore : g.awayScore - g.homeScore) + (p.market === "spreads" ? p.line || 0 : 0);
    return { result: margin === 0 ? "push" : margin > 0 ? "won" : "lost", actual: g.awayScore + "–" + g.homeScore };
  }
  if (p.market === "totals")
    return { result: compare(g.homeScore + g.awayScore, p.line!, p.side), actual: String(g.homeScore + g.awayScore) };
  if (stats === undefined) return { result: "review", actual: "Verify participation / settlement" };
  return {
    result: p.market === "player_anytime_td" ? (stats > 0 ? "won" : "lost") : compare(stats, p.line!, p.side),
    actual: String(stats),
  };
}

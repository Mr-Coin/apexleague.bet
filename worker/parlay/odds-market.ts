/** Parses The Odds API event response into pickable options. DraftKings is preferred when it posts the market. */

export interface OddsOutcome {
  name: string;
  description?: string;
  point?: number | null;
  price: number;
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets?: { key: string; last_update?: string; outcomes?: OddsOutcome[] }[];
}

export interface OddsEventResponse {
  id?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: OddsBookmaker[];
}

export interface OddsOption {
  player: string;
  side: string;
  line: number | null;
  odds: number;
  book: string;
  source: "feed";
  sourceTime: number;
}

export interface MarketOptions {
  options: OddsOption[];
  book: string | null;
  message: string | null;
}

export const oddsCacheTtl = (data: { options?: unknown[] }) => (data.options?.length ? 12 * 3600000 : 5 * 60000);

export function marketOptions(data: OddsEventResponse, market: string): MarketOptions {
  const books = [...(data.bookmakers || [])].sort((a, b) =>
    a.key === "draftkings" ? -1 : b.key === "draftkings" ? 1 : 0,
  );
  const book = books.find((b) => b.markets?.some((m) => m.key === market && m.outcomes?.length));
  const m = book?.markets?.find((m) => m.key === market);
  const options: OddsOption[] = (m?.outcomes || []).map((o) => ({
    player: o.description || "",
    side: o.name,
    line: o.point ?? null,
    odds: o.price,
    book: book?.title ?? "",
    source: "feed",
    sourceTime: Date.parse(m?.last_update || book?.last_update || "") || Date.now(),
  }));
  return {
    options,
    book: book?.title || null,
    message: options.length
      ? null
      : "No sportsbook has posted this market in the feed yet. Try again in five minutes or enter the pick manually.",
  };
}

import type { Pick } from "#shared/parlay/model";

// Historical market proxies, not recovered DraftKings ticket prices.
export type OddsEstimate = {
  odds: number;
  source: string;
  url: string;
  method: string;
  confidence: "medium" | "low";
};

export type PickWithEstimate = Pick & { oddsEstimate?: OddsEstimate };

const mgm = "https://sports.betmgm.com/en/blog/nfl/colts-chiefs-first-anytime-td-odds-picks-week-2-gaa/";
const bet365 =
  "https://news.bet365.com/en-us/article/colts-vs-chiefs-betting-odds-and-preview-for-sunday-night-football/2026091821045990314";

export function downsAlternateEstimate(): number {
  // De-vig O4.5 +120 / U4.5 -161, fit a Poisson count distribution,
  // convert to P(receptions >= 4), then restore the quoted overround.
  const tail = (lambda: number, k: number) => {
    let p = Math.exp(-lambda),
      sum = p;
    for (let i = 1; i < k; i++) {
      p *= lambda / i;
      sum += p;
    }
    return 1 - sum;
  };
  const over = 100 / 220,
    under = 161 / 261,
    overround = over + under,
    target = over / overround;
  let lo = 0,
    hi = 20;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (tail(mid, 5) < target) lo = mid;
    else hi = mid;
  }
  const probability = tail((lo + hi) / 2, 4) * overround;
  return Math.round((-100 * probability) / (1 - probability));
}

const estimates: Record<number, OddsEstimate> = {
  1: {
    odds: 180,
    source: "FOX Sports · DraftKings quote, Sep 20",
    url: "https://www.foxsports.com/stories/nfl/how-to-watch-vikings-vs-bears-tv-channel-live-stream-2026-week-2",
    method: "Published pregame Vikings moneyline; exact placement-time price unknown.",
    confidence: "medium",
  },
  4: {
    odds: 125,
    source: "BetMGM · Sep 20 pregame",
    url: "https://sports.betmgm.com/en/blog/nfl/vikings-bears-first-anytime-td-odds-picks-week-2-gaa/",
    method: "Historical Jefferson anytime-TD quote from another sportsbook.",
    confidence: "medium",
  },
  5: {
    odds: 160,
    source: "BetMGM · Sep 20 pregame",
    url: mgm,
    method: "Historical Rice anytime-TD quote from another sportsbook.",
    confidence: "medium",
  },
  7: {
    odds: downsAlternateEstimate(),
    source: "Model · Sports Betting Dime, Sep 20",
    url: "https://www.sportsbettingdime.com/news/nfl/colts-chiefs-player-prop-picks-best-bets-snf/",
    method:
      "Poisson model fitted to Downs O4.5 +120 / U4.5 -161, converted to 4+ with original overround. Low-confidence approximation, not an observed 4+ quote.",
    confidence: "low",
  },
  10: {
    odds: 240,
    source: "bet365 · Sep 18 pregame",
    url: bet365,
    method: "Historical Colts moneyline from another sportsbook; price may have moved.",
    confidence: "medium",
  },
  12: {
    odds: -155,
    source: "BetMGM · Sep 20 pregame",
    url: mgm,
    method: "Historical Taylor anytime-TD quote from another sportsbook.",
    confidence: "medium",
  },
};
const events: Record<number, string> = {
  1: "401872937",
  4: "401872937",
  5: "401872945",
  7: "401872945",
  10: "401872945",
  12: "401872945",
};

export function withHistoricalEstimate(
  season: number,
  week: number,
  team: number,
  pick: PickWithEstimate,
): PickWithEstimate {
  if (
    season !== 2026 ||
    week !== 2 ||
    pick.odds !== null ||
    events[team] !== pick.eventId ||
    !pick.note?.startsWith("Historical ticket backfill;")
  )
    return pick;
  return { ...pick, oddsEstimate: estimates[team] };
}

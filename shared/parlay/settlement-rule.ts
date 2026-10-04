/** How a saved pick will be graded; stored inside the pick JSON at save time. */
export type SettlementRule = {
  version: 1;
  provider: "espn";
  eventId: string;
  athleteId?: string;
  market: string;
  side: string;
  line: number | null;
  statKey: string;
};

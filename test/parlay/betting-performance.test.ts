import { describe, expect, it } from "vitest";
import { bettingRecords } from "../../worker/parlay/betting-performance";
import {
  downsAlternateEstimate,
  type PickWithEstimate,
  withHistoricalEstimate,
} from "../../worker/parlay/historical-odds";
import type { LeagueTeam } from "../../worker/parlay/types";

const team = (t: Partial<LeagueTeam>) => t as LeagueTeam;

describe("bettingRecords", () => {
  const leagues = new Map([
    [2025, { teams: [team({ id: 1, ownerKey: "same", personName: "Old name" })] }],
    [
      2026,
      {
        teams: [
          team({ id: 9, ownerKey: "same", personName: "Current name" }),
          team({ id: 1, ownerKey: "different", personName: "Different owner" }),
        ],
      },
    ],
  ]);
  const row = (season: number, team_id: number, result: string, odds: number | null) => ({
    season,
    team_id,
    result,
    week: 1,
    data: JSON.stringify({ odds }),
  });

  it("tracks American odds, flat stakes, refunds, missing odds and cross-season identity", () => {
    const rows = [
      row(2025, 1, "won", 200),
      row(2026, 9, "won", -200),
      row(2026, 9, "lost", 150),
      row(2026, 9, "push", -110),
      row(2026, 9, "void", 100),
      row(2026, 9, "pending", 300),
      row(2026, 9, "won", null),
      row(2026, 1, "lost", -110),
    ];
    const records = bettingRecords(rows, leagues);
    const p = records.find((x) => x.key === "same")!;
    expect(records.length).toBe(2);
    expect(p).toMatchObject({
      wins: 3,
      losses: 1,
      winRate: 75,
      units: 1.5,
      roi: 50,
      priced: 3,
      missingOdds: 1,
      pending: 1,
      pushes: 1,
      voids: 1,
    });
    expect(p.name).toBe("Current name");
    const unpriced = bettingRecords([row(2026, 9, "pending", 110)], leagues)[0];
    expect(unpriced.roi).toBeNull();
    expect(unpriced.winRate).toBeNull();
  });
});

describe("performance trends", () => {
  const l = new Map([[2026, { teams: [team({ id: 1, ownerKey: "a", personName: "A" })] }]]);
  const row = (week: number, result: string, odds: number | null, estimate?: { odds: number }) => ({
    season: 2026,
    week,
    team_id: 1,
    result,
    data: JSON.stringify({ odds, oddsEstimate: estimate }),
  });
  const rows = [
    row(3, "won", 100),
    row(2, "won", null, { odds: 180 }),
    row(4, "lost", -150),
    row(6, "lost", 110),
    row(7, "pending", 100),
  ];

  it("computes averages, chronological order, estimate toggle and streaks", () => {
    const confirmed = bettingRecords(rows, l)[0],
      estimated = bettingRecords(rows, l, true)[0];
    expect(confirmed.units).toBe(-1);
    expect(estimated.units).toBeCloseTo(0.8, 10);
    expect(estimated.estimated).toBe(1);
    expect(estimated.averageUnits).toBeCloseTo(0.2, 10);
    expect(estimated.averageDecimal).toBeCloseTo((2.8 + 2 + 1 + 100 / 150 + 2.1) / 4, 10);
    expect(estimated.longestWin).toBe(2);
    expect(estimated.longestLoss).toBe(1);
    expect(estimated.streak).toBe(0);
    expect(estimated.timeline[0].week).toBe(2);
    expect(estimated.timeline.at(-1)!.units).toBeNull();
    expect(confirmed.timeline[0].units).toBeNull();
    expect(confirmed.winRate).toBe(estimated.winRate);
  });

  it("applies the Downs model only to the matching Week 2 backfill pick", () => {
    expect(downsAlternateEstimate()).toBe(-196);
    const original = {
      odds: null,
      eventId: "401872945",
      note: "Historical ticket backfill; confirmed",
    } as PickWithEstimate;
    expect(withHistoricalEstimate(2026, 2, 7, original).oddsEstimate?.odds).toBe(-196);
    expect(withHistoricalEstimate(2026, 3, 7, original).oddsEstimate).toBeUndefined();
    expect(withHistoricalEstimate(2026, 2, 7, { ...original, odds: -180 }).oddsEstimate).toBeUndefined();
    expect(original.oddsEstimate).toBeUndefined();
  });
});

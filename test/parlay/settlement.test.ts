import { describe, expect, it } from "vitest";
import { type Game, type Pick, settle } from "#shared/parlay/model";
import { makeRule, readPlayerStat, statRules } from "../../worker/parlay/settlement";
import type { EspnSummary } from "../../worker/parlay/types";

const base = {
  eventId: "401872945",
  player: "Josh Downs",
  market: "player_receptions",
  side: "Over",
  line: 4.5,
} as Pick;
const pick: Pick = { ...base, settlement: makeRule(base, "4688813") };
const game = { id: pick.eventId, completed: true } as Game;

const freshBox = (): EspnSummary => ({
  header: { id: pick.eventId, competitions: [{ status: { type: { completed: true } } }] },
  boxscore: {
    players: [
      {
        statistics: [
          {
            name: "receiving",
            keys: ["receivingYards", "receptions"],
            labels: ["YDS", "REC"],
            athletes: [
              { athlete: { id: "4688813", displayName: "Different display name" }, stats: ["72", "7"] },
              { athlete: { id: "other", displayName: "Josh Downs" }, stats: ["90", "10"] },
            ],
          },
        ],
      },
    ],
  },
});

describe("readPlayerStat", () => {
  it("reads the verified athlete's stat by ID, not display name", () => {
    const box = freshBox();
    expect(readPlayerStat(box, pick)).toBe(7);
    expect(settle(pick, game, readPlayerStat(box, pick))?.result).toBe("won");
    expect(settle({ ...pick, line: 7 }, game, 7)?.result).toBe("push");
    expect(settle({ ...pick, side: "Under" }, game, 7)?.result).toBe("lost");
  });

  it("stays undefined for missing athlete, wrong game, unfinished game or blank stats", () => {
    const box = freshBox();
    expect(readPlayerStat(box, { ...pick, settlement: makeRule(pick, "missing") })).toBeUndefined();
    expect(readPlayerStat(box, { ...pick, eventId: "wrong-game" })).toBeUndefined();
    box.header!.competitions![0].status!.type!.completed = false;
    expect(readPlayerStat(box, pick)).toBeUndefined();
    box.header!.competitions![0].status!.type!.completed = true;
    for (const missing of ["", null, undefined, "--"]) {
      box.boxscore!.players![0].statistics![0].athletes![0].stats![1] = missing;
      expect(readPlayerStat(box, pick)).toBeUndefined();
    }
    box.boxscore!.players![0].statistics![0].athletes![0].stats![1] = "0";
    expect(readPlayerStat(box, pick)).toBe(0);
    expect(settle(pick, game, 0)?.result).toBe("lost");
  });

  it("maps every numeric prop market to its box score key", () => {
    for (const [market, rule] of Object.entries(statRules)) {
      const p = { eventId: "game", market, side: "Over", line: 4.5 } as Pick;
      p.settlement = makeRule(p, "player");
      expect(p.settlement.statKey).toBe(rule.key);
      const data: EspnSummary = {
        header: { id: "game", competitions: [{ status: { type: { completed: true } } }] },
        boxscore: {
          players: [
            {
              statistics: [
                { name: rule.group, keys: [rule.key], athletes: [{ athlete: { id: "player" }, stats: ["7"] }] },
              ],
            },
          ],
        },
      };
      expect(readPlayerStat(data, p)).toBe(7);
    }
  });
});

describe("anytime touchdown zero verification", () => {
  // A participating non-scorer may settle only after both teams' TDs reconcile.
  const tdBase = { ...pick, market: "player_anytime_td", side: "Yes", line: null } as Pick;
  const tdPick: Pick = { ...tdBase, settlement: makeRule(tdBase, "4688813") };
  const group = (name: string, keys: string[], athletes: { athlete: { id: string }; stats: string[] }[]) => ({
    name,
    keys,
    athletes,
  });
  const row = (id: string, stats: string[]) => ({ athlete: { id }, stats });
  const zeroBox = (): EspnSummary => ({
    header: {
      id: pick.eventId,
      competitions: [
        {
          status: { type: { completed: true } },
          competitors: [
            { id: "a", homeAway: "home", score: "7" },
            { id: "b", homeAway: "away", score: "0" },
          ],
        },
      ],
    },
    scoringPlays: [
      { type: { id: "67" }, scoringType: { name: "touchdown" }, team: { id: "a" }, homeScore: 7, awayScore: 0 },
    ],
    boxscore: {
      players: [
        {
          team: { id: "a" },
          statistics: [
            group("rushing", ["rushingAttempts", "rushingTouchdowns"], [row("runner", ["4", "0"])]),
            group(
              "receiving",
              ["receptions", "receivingTouchdowns"],
              [row("4688813", ["5", "0"]), row("scorer", ["1", "1"])],
            ),
          ],
        },
        {
          team: { id: "b" },
          statistics: [
            group("rushing", ["rushingAttempts", "rushingTouchdowns"], [row("other", ["4", "0"])]),
            group("receiving", ["receptions", "receivingTouchdowns"], []),
          ],
        },
      ],
    },
  });

  it("proves a zero only from a fully reconciled scoring log", () => {
    expect(readPlayerStat(zeroBox(), tdPick)).toBe(0);
    expect(settle(tdPick, game, readPlayerStat(zeroBox(), tdPick))?.result).toBe("lost");
  });

  it("keeps incomplete or unusual feeds pending", () => {
    type Box = ReturnType<typeof zeroBox>;
    const mutations: ((d: Box) => void)[] = [
      (d) => delete d.scoringPlays,
      (d) => {
        d.scoringPlays![0].homeScore = 14;
        d.header!.competitions![0].competitors![0].score = "14";
      },
      (d) => (d.scoringPlays![0].type!.id = "return-td"),
      (d) => (d.scoringPlays![0].homeScore = 6),
      (d) => (d.boxscore!.players![0].statistics![1].athletes![1].stats![1] = "0"),
      (d) => (d.boxscore!.players![0].statistics![1].athletes![0].stats![0] = "0"),
      (d) => (d.boxscore!.players![0].statistics![0].athletes![0].stats![1] = "--"),
      (d) => void d.boxscore!.players![0].statistics!.pop(),
    ];
    for (const mutate of mutations) {
      const invalid = zeroBox();
      mutate(invalid);
      expect(readPlayerStat(invalid, tdPick)).toBeUndefined();
    }
  });
});

import { describe, expect, it } from "vitest";
import { pickLabel, price, settle, type Game } from "#shared/parlay/model";
import { type BackfillDatabase, backfillWeek2, week2Entries, week2Pick } from "../../worker/parlay/week2-backfill";

const games = week2Entries.map((e) => ({ id: e.event, name: "Game", date: "2026-09-20T17:00Z", completed: true }));
const league = { teams: week2Entries.map((e) => ({ id: e.team, personName: e.name })) };

describe("week 2 backfill", () => {
  it("has 12 unique members, the exact 4+ line and missing odds preserved", () => {
    expect(week2Entries.length).toBe(12);
    expect(new Set(week2Entries.map((e) => e.team)).size).toBe(12);
    expect(week2Entries.filter((e) => e.odds === null).length).toBe(6);
    const downs = week2Pick(
      week2Entries.find((e) => e.team === 7)!,
      games[6],
    );
    expect(pickLabel(downs)).toBe("Josh Downs · 4+ receptions");
    expect(settle(downs, games[6] as Game, 4)?.result).toBe("won");
    expect(settle(downs, games[6] as Game, 3)?.result).toBe("lost");
    expect(price(null)).toBe("Odds unknown");
  });

  it("imports atomically without overwriting and is idempotent", async () => {
    let written = 0,
      marked = false;
    type Stmt = { sql: string; args: unknown[]; first(): Promise<unknown> };
    const db: BackfillDatabase = {
      prepare(sql) {
        return {
          bind(...args) {
            const stmt: Stmt = { sql, args, first: async () => (marked ? { id: args[0] } : null) };
            return stmt;
          },
        };
      },
      async batch(statements) {
        written = statements.length;
        marked = true;
        const stmts = statements as Stmt[];
        expect(stmts.slice(0, 12).every((s) => s.sql.includes("DO NOTHING") && s.sql.includes("'pending'"))).toBe(true);
      },
    };
    await backfillWeek2(db, league, games);
    expect(written).toBe(13);
    written = 0;
    await backfillWeek2(db, league, games);
    expect(written).toBe(0);
    marked = false;
    await expect(backfillWeek2(db, { teams: [] }, games)).rejects.toThrow();
  });
});

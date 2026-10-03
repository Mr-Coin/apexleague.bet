import type { Game, Pick as ParlayPick } from "#shared/parlay/model";
import type { LeagueData } from "./types";

// Exact September 20 ticket selections, with member assignments confirmed by Stu.
// No grades or individual prices inferred from same-game group prices.
export interface Week2Entry {
  team: number;
  name: string;
  event: string;
  side?: string;
  player?: string;
  market?: string;
  line?: number;
  odds: number | null;
}

export const week2Entries: Week2Entry[] = [
  { team: 1, name: "David Rasmussen", event: "401872937", side: "Minnesota Vikings", odds: null },
  { team: 2, name: "Brennan Champion", event: "401872934", player: "David Montgomery", odds: -145 },
  { team: 3, name: "Kevin Killeen", event: "401872938", player: "Derrick Henry", odds: -250 },
  { team: 4, name: "Henry Erzinger", event: "401872937", player: "Justin Jefferson", odds: null },
  { team: 5, name: "Jake Smith", event: "401872945", player: "Rashee Rice", odds: null },
  { team: 6, name: "Matt Gullickson", event: "401872940", side: "Jacksonville Jaguars", odds: 126 },
  {
    team: 7,
    name: "Stuart Alvey",
    event: "401872945",
    player: "Josh Downs",
    market: "player_receptions",
    side: "Over",
    line: 3.5,
    odds: null,
  },
  { team: 8, name: "Mike Tracy", event: "401872935", side: "Tampa Bay Buccaneers", odds: -430 },
  { team: 9, name: "Sam Lohmar", event: "401872933", side: "Carolina Panthers", odds: -142 },
  { team: 10, name: "Joseph Ross", event: "401872945", side: "Indianapolis Colts", odds: null },
  { team: 11, name: "Rodrigo Rabanal", event: "401872947", player: "Cam Skattebo", odds: 110 },
  { team: 12, name: "Cole Thomas", event: "401872945", player: "Jonathan Taylor", odds: null },
];

export function week2Pick(entry: Week2Entry, game: Pick<Game, "name" | "date">): ParlayPick {
  return {
    eventId: entry.event,
    game: game.name,
    kickoff: game.date,
    market: entry.market || (entry.player ? "player_anytime_td" : "h2h"),
    player: entry.player || "",
    side: entry.side || "Yes",
    line: entry.line ?? null,
    odds: entry.odds,
    book: "DraftKings",
    source: "manual",
    sourceTime: Date.parse("2026-09-20T16:41:00Z"),
    verificationPending: !!entry.player,
    note:
      "Historical ticket backfill; member assignments confirmed October 2, 2026." +
      (entry.team === 7 ? " Ticket: Josh Downs 4+ receptions (graded as over 3.5)." : "") +
      (entry.odds === null ? " Individual odds unavailable; only combined same-game pricing shown." : ""),
  };
}

/** The subset of D1 the backfill needs; lets tests pass a hand-rolled fake. */
export interface BackfillDatabase {
  prepare(query: string): { bind(...values: unknown[]): { first(): Promise<unknown> } };
  batch(statements: unknown[]): Promise<unknown>;
}

export async function backfillWeek2(
  database: BackfillDatabase,
  league: Pick<LeagueData, "teams"> | { teams: { id: number; personName?: string | null }[] },
  gameList: (Pick<Game, "id" | "name" | "date"> & { scheduleOnly?: boolean })[],
): Promise<void> {
  const marker = "backfill:2026:2:confirmed-ticket-v1";
  if (await database.prepare("SELECT id FROM cache WHERE id=?").bind(marker).first()) return;
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
  const statements = week2Entries.map((entry) => {
    const person = league.teams.find((t) => t.id === entry.team);
    const game = gameList.find((g) => g.id === entry.event);
    if (!person || normalize(person.personName || "") !== entry.name || !game || game.scheduleOnly)
      throw new Error("Week 2 backfill requires verified member and game data.");
    const pick = week2Pick(entry, game);
    return database
      .prepare(
        "INSERT INTO picks(id,season,week,team_id,user_id,data,result,updated) VALUES(?,2026,2,?,? ,?,'pending',?) ON CONFLICT(season,week,team_id) DO NOTHING",
      )
      .bind(
        "ticket-backfill-2026-2-" + entry.team,
        entry.team,
        "confirmed-historical-ticket",
        JSON.stringify(pick),
        Date.now(),
      );
  });
  // Batch is atomic; existing picks are never overwritten. No caller data or grades accepted.
  statements.push(
    database
      .prepare("INSERT INTO cache(id,data,updated) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING")
      .bind(marker, '{"approved":true}', Date.now()),
  );
  await database.batch(statements);
}

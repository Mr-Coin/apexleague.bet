import teams from "./nfl-teams.json" with { type: "json" };

// Team identities from ESPN's NFL teams endpoint, checked 2026-09-24.
export const nameKey = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function teamId(name: string): string | undefined {
  const key = nameKey(name);
  const matches = teams.filter((t) => [t.name, t.abbreviation].some((n) => nameKey(n) === key));
  return matches.length === 1 ? matches[0].id : undefined;
}
export function sameTeam(a: string, b: string) {
  const x = teamId(a),
    y = teamId(b);
  return x && y ? x === y : nameKey(a) === nameKey(b);
}
export type OddsEvent = { id: string; home_team: string; away_team: string; commence_time: string };
export function oddsEventForGame(events: OddsEvent[], game: { home: string; away: string; date: string }) {
  const matches = events.filter(
    (e) =>
      sameTeam(e.home_team, game.home) &&
      sameTeam(e.away_team, game.away) &&
      Math.abs(Date.parse(e.commence_time) - Date.parse(game.date)) < 86400000,
  );
  if (matches.length !== 1)
    throw new Error(
      matches.length
        ? "Multiple odds events match this game. Please retry after the schedule refreshes."
        : "No matching odds event yet. Use manual entry or try later.",
    );
  return matches[0];
}
export function uniquePlayerId(name: string, players: { id?: string; displayName?: string }[]): string | undefined {
  const key = nameKey(name),
    withoutSuffix = (s: string) => s.replace(/(jr|sr|iii|ii)$/, "");
  // Include all formatting/suffix matches before testing uniqueness; never choose the first candidate.
  const ids = new Set(
    players
      .filter((p) => p.id && p.displayName && withoutSuffix(nameKey(p.displayName)) === withoutSuffix(key))
      .map((p) => String(p.id)),
  );
  return ids.size === 1 ? [...ids][0] : undefined;
}

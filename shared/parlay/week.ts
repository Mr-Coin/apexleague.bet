// Clubhouse weeks run Tuesday 6 a.m. Eastern through the next Tuesday.
export function pickDeadline(season: number, week: number) {
  const sept1 = new Date(Date.UTC(season, 8, 1));
  const laborDay = 1 + ((8 - sept1.getUTCDay()) % 7);
  const local = Date.UTC(season, 8, laborDay + 6 + 7 * (week - 1), 13);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(
      new Date(local),
    ),
  );
  return local + (13 - hour) * 3600000; // Sunday 1 p.m. Eastern, including DST.
}
export const isThursday = (date: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(new Date(date)) === "Thu";
export const picksClosed = (season: number, week: number, now = Date.now()) => now >= pickDeadline(season, week);
// Regular-season week 1 begins the Tuesday after Labor Day.
export function activeWeek(season: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (key: string) => Number(parts.find((p) => p.type === key)?.value);
  const local = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"));
  const sept1 = new Date(Date.UTC(season, 8, 1));
  const laborDay = 1 + ((8 - sept1.getUTCDay()) % 7);
  const start = Date.UTC(season, 8, laborDay + 1, 6);
  return Math.max(1, Math.min(18, Math.floor((local - start) / (7 * 86400000)) + 1));
}

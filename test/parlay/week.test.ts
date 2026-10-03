import { describe, expect, it } from "vitest";
import { activeWeek, isThursday, pickDeadline, picksClosed } from "#shared/parlay/week";

describe("activeWeek", () => {
  it("rolls over Tuesday 6 a.m. Eastern, including DST and January", () => {
    expect(activeWeek(2026, new Date("2026-09-22T00:00:00Z"))).toBe(2); // Monday night ET
    expect(activeWeek(2026, new Date("2026-09-22T09:59:59Z"))).toBe(2);
    expect(activeWeek(2026, new Date("2026-09-22T10:00:00Z"))).toBe(3);
    expect(activeWeek(2026, new Date("2026-11-10T10:59:59Z"))).toBe(9); // Standard time
    expect(activeWeek(2026, new Date("2026-11-10T11:00:00Z"))).toBe(10);
    expect(activeWeek(2026, new Date("2027-01-05T11:00:00Z"))).toBe(18);
  });
});

describe("pickDeadline", () => {
  it("locks Sunday 1 p.m. Eastern", () => {
    expect(new Date(pickDeadline(2026, 3)).toISOString()).toBe("2026-09-27T17:00:00.000Z");
    expect(picksClosed(2026, 3, Date.parse("2026-09-27T16:44:31Z"))).toBe(false);
    expect(picksClosed(2026, 3, Date.parse("2026-09-27T16:59:59Z"))).toBe(false);
    expect(picksClosed(2026, 3, Date.parse("2026-09-27T17:00:00Z"))).toBe(true);
    expect(picksClosed(2026, 3, Date.parse("2026-09-28T22:00:00Z"))).toBe(true);
    expect(new Date(pickDeadline(2026, 9)).toISOString()).toBe("2026-11-08T18:00:00.000Z");
  });
});

describe("isThursday", () => {
  it("uses Eastern time", () => {
    expect(isThursday("2026-09-25T00:15:00Z")).toBe(true);
    expect(isThursday("2026-09-27T16:30:00Z")).toBe(false);
  });
});

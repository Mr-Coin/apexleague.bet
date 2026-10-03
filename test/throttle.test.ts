import { describe, expect, it } from "vitest";
import { consumeAttempt } from "../worker/throttle";
import { fakeD1 } from "./parlay/fake-d1";

describe("consumeAttempt", () => {
  it("allows `limit` attempts per fixed window, then resets in the next window", async () => {
    const db = fakeD1();
    const t0 = 1_000_000;
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push(await consumeAttempt(db, "k", 3, 1000, t0 + i));
    expect(results).toEqual([true, true, true, false]);
    expect(await consumeAttempt(db, "k", 3, 1000, t0 + 1000)).toBe(true);
    expect(await consumeAttempt(db, "other", 3, 1000, t0)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { newSession, secretsMatch, signSession, verifySession } from "../worker/session";

const SECRET = "unit-test-secret";

describe("session cookie", () => {
  it("round-trips a signed session", async () => {
    const s = newSession("member", 1_000);
    const token = await signSession(SECRET, s);
    expect(await verifySession(SECRET, token, 2_000)).toEqual(s);
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession(SECRET, newSession("member"));
    const [payload, sig] = token.split(".");
    // Flip role by re-encoding a modified payload with the original signature.
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    json.role = "commissioner";
    const forged = btoa(JSON.stringify(json)).replace(/=+$/, "") + "." + sig;
    expect(await verifySession(SECRET, forged)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSession("other", newSession("member"));
    expect(await verifySession(SECRET, token)).toBeNull();
  });

  it("rejects expired, malformed and missing tokens", async () => {
    const s = newSession("member", 0);
    const token = await signSession(SECRET, s);
    expect(await verifySession(SECRET, token, s.exp + 1)).toBeNull();
    expect(await verifySession(SECRET, "garbage")).toBeNull();
    expect(await verifySession(SECRET, "a.b")).toBeNull();
    expect(await verifySession(SECRET, undefined)).toBeNull();
  });

  it("commissioner sessions are shorter-lived than member sessions", () => {
    expect(newSession("commissioner", 0).exp).toBeLessThan(newSession("member", 0).exp);
  });
});

describe("secretsMatch", () => {
  it("matches equal strings and rejects different or empty expected values", async () => {
    expect(await secretsMatch("hunter2", "hunter2")).toBe(true);
    expect(await secretsMatch("hunter2", "hunter3")).toBe(false);
    expect(await secretsMatch("hunter2", "hunter22")).toBe(false);
    expect(await secretsMatch("", "")).toBe(false);
  });
});

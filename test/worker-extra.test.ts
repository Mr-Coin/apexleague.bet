// Edge branches of the auth stack: cookie flags, anonymous session reads, odd tokens and counter fallbacks.
import { describe, expect, it } from "vitest";
import worker from "../worker/index";
import { verifySession } from "../worker/session";
import { consumeAttempt } from "../worker/throttle";
import { fakeD1 } from "./parlay/fake-d1";
import { testEnv } from "./parlay/helpers";

const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext;

describe("auth cookie and session reads", () => {
  it("marks the cookie Secure only over https and reports anonymous sessions", async () => {
    const db = fakeD1();
    const env = testEnv(db);
    const login = (origin: string) =>
      worker.fetch(
        new Request(origin + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: origin },
          body: JSON.stringify({ password: "pw" }),
        }),
        env,
        ctx,
      );
    expect((await login("https://test.invalid")).headers.get("set-cookie")).toMatch(/; Secure$/);
    expect((await login("http://localhost:5173")).headers.get("set-cookie")).not.toMatch(/Secure/);
    const anon = await worker.fetch(new Request("https://test.invalid/api/auth/session"), env, ctx);
    expect(await anon.json()).toEqual({ authenticated: false, commissioner: false, expiresAt: null });
    db.close();
  });
});

describe("verifySession", () => {
  it("rejects a correctly signed token whose payload is not JSON", async () => {
    const secret = "s";
    const encoder = new TextEncoder();
    const b64 = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const payload = b64(encoder.encode("not json"));
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);
    const sig = b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
    expect(await verifySession(secret, payload + "." + sig)).toBeNull();
    expect(await verifySession(secret, "nodot")).toBeNull();
    expect(await verifySession(secret, payload + ".%%%")).toBeNull();
  });
});

describe("consumeAttempt", () => {
  it("allows the attempt when the database returns no count", async () => {
    const db = {
      prepare: () => ({ bind: () => ({ first: async () => null }) }),
    } as unknown as D1Database;
    expect(await consumeAttempt(db, "k", 1, 1000)).toBe(true);
  });
});

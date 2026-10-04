import { describe, expect, it } from "vitest";
import worker from "../worker/index";
import type { AppEnv } from "../worker/env";
import { newSession, signSession } from "../worker/session";
import { testEnv } from "./parlay/helpers";

const origin = "https://test.invalid";
const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext;

function post(env: AppEnv, path: string, body: unknown, headers: Record<string, string> = {}) {
  return worker.fetch(
    new Request(origin + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin, ...headers },
      body: JSON.stringify(body),
    }),
    env,
    ctx,
  );
}

const denied = { limit: async () => ({ success: false }) } as unknown as RateLimit;

describe("auth routes", () => {
  it("logs in with the league password and sets a hardened cookie", async () => {
    const env = testEnv();
    const r = await post(env, "/api/auth/login", { password: "pw" });
    expect(r.status).toBe(200);
    const cookie = r.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^apex_session=/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Path=/");
  });

  it("rejects a wrong password and a cross-site login", async () => {
    const env = testEnv();
    expect((await post(env, "/api/auth/login", { password: "nope" })).status).toBe(401);
    const cross = await post(env, "/api/auth/login", { password: "pw" }, { Origin: "https://evil.invalid" });
    expect(cross.status).toBe(403);
    expect(cross.headers.get("set-cookie")).toBeNull();
  });

  it("reports missing configuration instead of failing opaquely", async () => {
    const env = { ...testEnv(), SESSION_SECRET: "" };
    const r = await post(env, "/api/auth/login", { password: "pw" });
    expect(r.status).toBe(503);
    expect(((await r.json()) as { error: string }).error).toMatch(/not configured/);
  });

  it("caps password attempts per IP at 20 per ten minutes even when the binding is permissive", async () => {
    const env = testEnv();
    const statuses: number[] = [];
    for (let i = 0; i < 22; i++)
      statuses.push(
        (await post(env, "/api/auth/login", { password: "wrong" }, { "cf-connecting-ip": "203.0.113.9" })).status,
      );
    expect(statuses.slice(0, 20).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(20)).toEqual([429, 429]);
    // Another address is unaffected.
    expect(
      (await post(env, "/api/auth/login", { password: "pw" }, { "cf-connecting-ip": "203.0.113.10" })).status,
    ).toBe(200);
  });

  it("caps PIN attempts per IP at 5 per ten minutes", async () => {
    const env = testEnv();
    const cookie = "apex_session=" + (await signSession(env.SESSION_SECRET, newSession("member")));
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await post(env, "/api/auth/commissioner", { pin: "wrong1" }, { cookie })).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it("returns 429 when the login limiter denies", async () => {
    const env = { ...testEnv(), LOGIN_LIMITER: denied };
    expect((await post(env, "/api/auth/login", { password: "pw" })).status).toBe(429);
  });

  it("commissioner elevation needs a session, a 6+ char PIN, its own limiter, and the right PIN", async () => {
    const env = testEnv();
    expect((await post(env, "/api/auth/commissioner", { pin: "pin123" })).status).toBe(401);

    const cookie = "apex_session=" + (await signSession(env.SESSION_SECRET, newSession("member")));
    const short = await post(env, "/api/auth/commissioner", { pin: "pin" }, { cookie });
    expect(short.status).toBe(400);

    const limited = await post(
      { ...env, PIN_LIMITER: denied },
      "/api/auth/commissioner",
      { pin: "pin123" },
      { cookie },
    );
    expect(limited.status).toBe(429);

    const wrong = await post(
      { ...env, COMMISSIONER_PIN: "secret" },
      "/api/auth/commissioner",
      { pin: "pin123" },
      { cookie },
    );
    expect(wrong.status).toBe(401);

    const ok = await post(
      { ...env, COMMISSIONER_PIN: "pin123" },
      "/api/auth/commissioner",
      { pin: "pin123" },
      { cookie },
    );
    expect(ok.status).toBe(200);
    const elevated = ok.headers.get("set-cookie")!.split(";")[0];
    const session = await worker.fetch(
      new Request(origin + "/api/auth/session", { headers: { cookie: elevated } }),
      env,
      ctx,
    );
    expect(await session.json()).toMatchObject({ authenticated: true, commissioner: true });
  });

  it("logout clears the cookie and rejects cross-site requests", async () => {
    const env = testEnv();
    const r = await post(env, "/api/auth/logout", {});
    expect(r.status).toBe(200);
    expect(r.headers.get("set-cookie")).toMatch(/apex_session=;.*Max-Age=0/);
    expect((await post(env, "/api/auth/logout", {}, { Origin: "https://evil.invalid" })).status).toBe(403);
  });

  it("never echoes internal error details", async () => {
    const throwing = {
      limit: async () => {
        throw new Error("D1_ERROR: something internal");
      },
    } as unknown as RateLimit;
    const r = await post({ ...testEnv(), LOGIN_LIMITER: throwing }, "/api/auth/login", { password: "pw" });
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "Request could not be completed." });
  });
});

// Top-level Worker entry: API routing, asset gating and the scheduled settlement hook.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../worker/index";
import type { AppEnv } from "../worker/env";
import { fakeD1 } from "./parlay/fake-d1";
import { cookieFor, testEnv } from "./parlay/helpers";

const fixed = Date.parse("2026-09-24T14:00:00Z");
const db = fakeD1(() => fixed);
const env = testEnv(db);
const origin = "https://test.invalid";
const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext;

beforeAll(() => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", async () => new Response("down", { status: 503 }));
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  db.close();
});

describe("fetch", () => {
  it("answers unknown API paths with JSON 404 and no-store", async () => {
    const r = await worker.fetch(new Request(origin + "/api/nope"), env, ctx);
    expect(r.status).toBe(404);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.json()).toEqual({ error: "Not found." });
    expect((await worker.fetch(new Request(origin + "/api"), env, ctx)).status).toBe(404);
  });

  it("gates static assets on the session cookie", async () => {
    const seen: string[] = [];
    const gated = {
      ...env,
      ASSETS: {
        fetch: async (r: Request) => (seen.push(new URL(r.url).pathname), new Response("asset")),
      } as unknown as Fetcher,
    };
    await worker.fetch(new Request(origin + "/photos/secret.jpg"), gated, ctx);
    await worker.fetch(
      new Request(origin + "/photos/secret.jpg", { headers: { cookie: await cookieFor("member") } }),
      gated,
      ctx,
    );
    expect(seen).toEqual(["/", "/photos/secret.jpg"]);
  });

  it("reports unexpected failures without leaking details", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      ...env,
      DB: {
        prepare() {
          throw new Error("D1 offline: connection string");
        },
      } as unknown as AppEnv["DB"],
    };
    const r = await worker.fetch(
      new Request(origin + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ password: "pw" }),
      }),
      broken,
      ctx,
    );
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "Request could not be completed." });
    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe("scheduled", () => {
  const run = async (e: AppEnv) => {
    const pending: Promise<unknown>[] = [];
    const sched = { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException() {} };
    await worker.scheduled({} as ScheduledController, e, sched as unknown as ExecutionContext);
    await Promise.all(pending);
  };

  it("runs settlement in the background and logs a failing report", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await run(env);
    // The Week 2 backfill cannot verify members without ESPN, so this run reports errors.
    expect(error).toHaveBeenCalledWith("Settlement check reported errors", expect.stringContaining("backfill:2026:2"));
    error.mockClear();
    await run(env); // lease held → skipped → nothing logged
    expect(error).not.toHaveBeenCalled();
  });
});

import worker from "../../worker/index";
import type { AppEnv } from "../../worker/env";
import { newSession, type Role, signSession } from "../../worker/session";
import { fakeD1, type FakeD1 } from "./fake-d1";

export const SECRET = "parlay-test-secret";

export function testEnv(db: FakeD1 = fakeD1()): AppEnv & { DB: FakeD1 } {
  return {
    DB: db,
    ASSETS: { fetch: async () => new Response("asset") } as unknown as Fetcher,
    LOGIN_LIMITER: { limit: async () => ({ success: true }) } as unknown as RateLimit,
    PIN_LIMITER: { limit: async () => ({ success: true }) } as unknown as RateLimit,
    ESPN_LEAGUE_ID: "244513322",
    LEAGUE_PASSWORD: "pw",
    COMMISSIONER_PIN: "pin",
    SESSION_SECRET: SECRET,
  };
}

export async function cookieFor(role: Role): Promise<string> {
  return "apex_session=" + (await signSession(SECRET, newSession(role)));
}

const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext;

export interface Client {
  get(query?: string): Promise<Response>;
  post(body: unknown, path?: string): Promise<Response>;
}

/** Same-origin client for the Worker's fetch handler, with a signed session cookie. */
export async function client(env: AppEnv, role: Role | null = "member"): Promise<Client> {
  const origin = "https://test.invalid";
  const headers: Record<string, string> = role ? { cookie: await cookieFor(role) } : {};
  return {
    get: (query = "") => worker.fetch(new Request(origin + "/api/parlay" + query, { headers }), env, ctx),
    post: (body, path = "/api/parlay") =>
      worker.fetch(
        new Request(origin + path, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", Origin: origin },
          body: JSON.stringify(body),
        }),
        env,
        ctx,
      ),
  };
}

export const json = async <T = Record<string, unknown>>(r: Response): Promise<T> => (await r.json()) as T;

import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import type { AppEnv } from "./env";
import {
  COMMISSIONER_TTL_MS,
  MEMBER_TTL_MS,
  SESSION_COOKIE,
  newSession,
  secretsMatch,
  signSession,
  verifySession,
  type Session,
} from "./session";

export type AppContext = { Bindings: AppEnv; Variables: { session: Session | null } };

/** Rejects cross-site writes. Browsers always send Origin on cross-origin POSTs. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) throw new HttpError(403, "Cross-site request rejected.");
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function readSession(req: Request, env: AppEnv): Promise<Session | null> {
  // No secret configured (fresh deploy) → nobody is signed in, rather than a crypto error on every request.
  if (!env.SESSION_SECRET) return null;
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(SESSION_COOKIE + "="));
  return verifySession(env.SESSION_SECRET, cookie?.slice(SESSION_COOKIE.length + 1));
}

async function issue(
  c: { req: { url: string }; env: AppEnv; header: (n: string, v: string) => void },
  session: Session,
) {
  const token = await signSession(c.env.SESSION_SECRET, session);
  const secure = new URL(c.req.url).protocol === "https:";
  // hono's setCookie needs the real context; build the header by hand to keep this helper context-agnostic.
  const maxAge = Math.floor((session.role === "commissioner" ? COMMISSIONER_TTL_MS : MEMBER_TTL_MS) / 1000);
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
  );
}

async function rateLimit(c: { env: AppEnv; req: { header: (n: string) => string | undefined } }, limiter: RateLimit) {
  const key = c.req.header("cf-connecting-ip") ?? "local";
  const { success } = await limiter.limit({ key });
  if (!success) throw new HttpError(429, "Too many attempts. Try again in a minute.");
}

const passwordBody = z.object({ password: z.string().min(1).max(200) });
// The PIN guards grading overrides on the pot; require some entropy and a tighter limiter.
const pinBody = z.object({ pin: z.string().min(6).max(50) });

export const authRoutes = new Hono<AppContext>()
  .get("/session", (c) => {
    const s = c.get("session");
    return c.json({ authenticated: !!s, commissioner: s?.role === "commissioner", expiresAt: s?.exp ?? null });
  })
  .post("/login", async (c) => {
    assertSameOrigin(c.req.raw);
    if (!c.env.SESSION_SECRET || !c.env.LEAGUE_PASSWORD)
      throw new HttpError(503, "Sign-in is not configured yet. Set LEAGUE_PASSWORD and SESSION_SECRET.");
    await rateLimit(c, c.env.LOGIN_LIMITER);
    const { password } = passwordBody.parse(await c.req.json());
    if (!(await secretsMatch(password, c.env.LEAGUE_PASSWORD))) throw new HttpError(401, "Incorrect password.");
    await issue(c, newSession("member"));
    return c.json({ ok: true });
  })
  .post("/commissioner", async (c) => {
    assertSameOrigin(c.req.raw);
    if (!c.get("session")) throw new HttpError(401, "Sign in first.");
    await rateLimit(c, c.env.PIN_LIMITER);
    const { pin } = pinBody.parse(await c.req.json());
    if (!(await secretsMatch(pin, c.env.COMMISSIONER_PIN))) throw new HttpError(401, "Incorrect commissioner PIN.");
    await issue(c, newSession("commissioner"));
    return c.json({ ok: true });
  })
  .post("/logout", (c) => {
    assertSameOrigin(c.req.raw);
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true });
  });

// Re-exported so the main app and tests share a single cookie reader.
export { getCookie, setCookie };

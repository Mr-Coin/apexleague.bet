import { Hono } from "hono";
import { ZodError } from "zod";
import { serveAsset } from "./assets";
import { authRoutes, HttpError, readSession, type AppContext } from "./auth";
import type { AppEnv } from "./env";

const api = new Hono<AppContext>().basePath("/api");

api.use("*", async (c, next) => {
  c.set("session", await readSession(c.req.raw, c.env));
  c.header("Cache-Control", "no-store");
  await next();
});

api.route("/auth", authRoutes);

// Parlay routes mount here (worker/parlay/routes.ts). They require a session.

api.notFound((c) => c.json({ error: "Not found." }, 404));
api.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 400);
  if (err instanceof ZodError) return c.json({ error: "Please check all required fields." }, 400);
  console.error(err);
  return c.json({ error: err instanceof Error ? err.message : "Request could not be completed." }, 500);
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return api.fetch(request, env, ctx);
    const session = await readSession(request, env);
    return serveAsset(request, env, !!session);
  },

  async scheduled(_event, _env, _ctx) {
    // Settlement cron wired in worker/parlay/settle.ts.
  },
} satisfies ExportedHandler<AppEnv>;

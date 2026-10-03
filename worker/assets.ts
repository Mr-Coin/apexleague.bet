import type { AppEnv } from "./env";

/**
 * Paths an anonymous visitor may fetch: the SPA shell, its hashed bundles and
 * what the lock screen itself renders. Everything else in public/ (member
 * photos, team logos, bylaws PDF) requires a session.
 */
const PUBLIC_EXACT = new Set(["/", "/index.html", "/favicon.ico", "/league-logo.jpg", "/robots.txt"]);

export function isPublicAsset(pathname: string): boolean {
  return PUBLIC_EXACT.has(pathname) || pathname.startsWith("/assets/");
}

/** Serve a static asset, or fall back to the SPA shell (which renders the lock screen). */
export async function serveAsset(request: Request, env: AppEnv, authenticated: boolean): Promise<Response> {
  const url = new URL(request.url);
  if (authenticated || isPublicAsset(url.pathname)) return env.ASSETS.fetch(request);
  // Non-GET or private file without a session → shell with lock screen. Never leak whether the file exists.
  const shell = new URL("/", url);
  return env.ASSETS.fetch(new Request(shell, { headers: request.headers }));
}

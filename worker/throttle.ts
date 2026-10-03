/**
 * Exact fixed-window attempt counter in D1.
 *
 * The Workers rate-limit binding is per-colo, permissive and eventually
 * consistent (it let 40+ bad logins through in a burst on staging), so it is
 * only the first, cheap filter. This counter is the one that actually bounds
 * password and PIN guessing.
 */
export async function consumeAttempt(
  db: D1Database,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const windowStart = now - (now % windowMs);
  // One statement: start a new window, or bump the count inside the current one.
  const row = await db
    .prepare(
      `INSERT INTO auth_attempts(key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN auth_attempts.window_start = excluded.window_start THEN auth_attempts.count + 1 ELSE 1 END,
         window_start = excluded.window_start
       RETURNING count`,
    )
    .bind(key, windowStart)
    .first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

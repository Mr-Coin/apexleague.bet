/** Small JSON key/value cache in the D1 `cache` table (provider snapshots, leases, markers). */

export interface CacheEntry<T> {
  data: T;
  updated: number;
}

export async function cached<T = unknown>(db: D1Database, id: string): Promise<CacheEntry<T> | null> {
  const row = await db.prepare("SELECT * FROM cache WHERE id=?").bind(id).first<{ data: string; updated: number }>();
  return row ? { data: JSON.parse(row.data) as T, updated: row.updated } : null;
}

export async function putCache(db: D1Database, id: string, data: unknown): Promise<void> {
  await db
    .prepare(
      "INSERT INTO cache(id,data,updated) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated",
    )
    .bind(id, JSON.stringify(data), Date.now())
    .run();
}

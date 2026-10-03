/**
 * In-memory D1 stand-in backed by node:sqlite, loaded with the real migration.
 * `now` replaces D1's `CAST(strftime('%s','now') AS INTEGER)*1000` so deadline
 * SQL evaluates against the test clock rather than wall time.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS = path.resolve(import.meta.dirname, "../../migrations");
const NOW_SQL = "CAST(strftime('%s','now') AS INTEGER)*1000";

type Row = Record<string, unknown>;

export interface FakeD1 extends D1Database {
  sql: DatabaseSync;
  close(): void;
}

export function fakeD1(now: () => number = Date.now): FakeD1 {
  const sql = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sql.exec(readFileSync(path.join(MIGRATIONS, file), "utf8"));

  const prepare = (query: string) => {
    let args: unknown[] = [];
    const compile = () => sql.prepare(query.replaceAll(NOW_SQL, String(now())));
    const stmt = {
      bind(...values: unknown[]) {
        args = values;
        return stmt;
      },
      async first<T = Row>(column?: string): Promise<T | null> {
        const row = compile().get(...(args as never[])) as Row | undefined;
        if (!row) return null;
        return (column ? row[column] : row) as T;
      },
      async all<T = Row>() {
        const results = compile().all(...(args as never[])) as T[];
        return { results, success: true, meta: { changes: 0 } } as unknown as D1Result<T>;
      },
      async run() {
        const r = compile().run(...(args as never[]));
        return { success: true, results: [], meta: { changes: Number(r.changes) } } as unknown as D1Result;
      },
      async raw() {
        return compile().all(...(args as never[])) as never;
      },
    };
    return stmt as unknown as D1PreparedStatement;
  };

  const db = {
    sql,
    prepare,
    async batch(statements: D1PreparedStatement[]) {
      sql.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sql.exec("COMMIT");
        return out;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
    async exec(q: string) {
      sql.exec(q);
      return { count: 1, duration: 0 };
    },
    dump: async () => new ArrayBuffer(0),
    withSession: () => {
      throw new Error("not implemented");
    },
    close: () => sql.close(),
  };
  return db as unknown as FakeD1;
}

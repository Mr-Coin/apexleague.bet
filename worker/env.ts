/** Bindings and secrets declared in wrangler.jsonc / `wrangler secret put`. */
export interface AppEnv {
  ASSETS: Fetcher;
  DB: D1Database;
  LOGIN_LIMITER: RateLimit;

  ESPN_LEAGUE_ID: string;

  LEAGUE_PASSWORD: string;
  COMMISSIONER_PIN: string;
  SESSION_SECRET: string;

  ESPN_S2?: string;
  ESPN_SWID?: string;
  ODDS_API_KEY?: string;
}

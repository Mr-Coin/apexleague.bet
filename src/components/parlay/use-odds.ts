import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { OddsData, WeekContext } from "./types";

interface CachedOdds extends OddsData {
  received: number;
}

/** Page-lifetime cache: posted markets stay fresh 12h, empty markets retry after 5 minutes. */
const cache = new Map<string, CachedOdds>();
const ttl = (d: OddsData) => (d.options.length ? 12 * 3_600_000 : 300_000);

interface Options {
  enabled: boolean;
  context: WeekContext;
  eventId: string;
  market: string;
}

/** Fetches feed odds for the selected game/market; results are keyed so a stale game never shows. */
export function useOdds({ enabled, context, eventId, market }: Options) {
  const key = enabled && eventId ? `${context.season}:${context.week}:${eventId}:${market}` : "";
  const [state, setState] = useState<{ key: string; data: OddsData | null; error: string; loading: boolean }>({
    key: "",
    data: null,
    error: "",
    loading: false,
  });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!key) return;
    const previous = cache.get(key);
    if (previous && Date.now() - previous.received < ttl(previous)) {
      Promise.resolve().then(() => setState({ key, data: previous, error: "", loading: false }));
      return;
    }
    let active = true;
    const [, , event, mkt] = key.split(":");
    Promise.resolve()
      .then(() => {
        setState({ key, data: null, error: "", loading: true });
        return api<OddsData>(
          `/api/parlay?action=odds&season=${context.season}&week=${context.week}&event=${encodeURIComponent(event)}&market=${encodeURIComponent(mkt)}`,
        );
      })
      .then(
        (d) => {
          if (!active) return;
          cache.set(key, { ...d, received: Date.now() });
          setState({ key, data: d, error: "", loading: false });
        },
        (e: unknown) => {
          if (active)
            setState({ key, data: null, error: e instanceof Error ? e.message : "Odds unavailable.", loading: false });
        },
      );
    return () => {
      active = false;
    };
  }, [key, context.season, context.week, retry]);

  const matches = state.key === key && key !== "";
  return {
    oddsData: matches ? state.data : null,
    oddsError: matches ? state.error : "",
    loadingOdds: matches && state.loading,
    retryOdds: () => setRetry((v) => v + 1),
  };
}

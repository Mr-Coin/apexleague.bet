import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ClubhouseData, ParlayAction, WeekContext } from "./types";

export type ParlayTab = "week" | "history" | "settings";

const REFRESH_MS = 120_000;

/** NFL seasons roll over in March. */
export function currentSeason(now = new Date()): number {
  return now.getFullYear() - (now.getMonth() < 2 ? 1 : 0);
}

const message = (e: unknown) => (e instanceof Error ? e.message : "Could not complete request.");

/**
 * Loads /api/parlay for the active tab, refreshes every two minutes while the
 * page is visible, and ignores responses that arrive out of order.
 */
export function useParlay() {
  const [data, setData] = useState<ClubhouseData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /** Wall-clock at the last successful load; lets render code compare kickoffs without calling Date.now(). */
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const [tab, setTabState] = useState<ParlayTab>("week");
  const [season, setSeasonState] = useState(String(currentSeason()));
  const [week, setWeek] = useState("current");
  const loadSequence = useRef(0);

  const load = useCallback((): Promise<void> => {
    const sequence = ++loadSequence.current;
    const history = tab === "history";
    const query = history
      ? `season=${season}${week === "current" ? "" : `&week=${week}`}&stats=1`
      : `season=${currentSeason()}`;
    return Promise.resolve()
      .then(() => {
        setBusy(true);
        return api<ClubhouseData>(`/api/parlay?${query}`);
      })
      .then(
        (d) => {
          if (!current()) return;
          setData(d);
          setLoadedAt(Date.now());
          setError("");
        },
        (e: unknown) => {
          if (current()) setError(message(e));
        },
      )
      .finally(() => {
        if (current()) setBusy(false);
      });
    function current() {
      return sequence === loadSequence.current;
    }
  }, [season, week, tab]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const contextSeason = data?.season ?? Number(season);
  const contextWeek = data?.week ?? 1;
  const context = useMemo<WeekContext>(
    () => ({ season: contextSeason, week: contextWeek }),
    [contextSeason, contextWeek],
  );

  /** POST an action, reload, and toast the outcome. Resolves true on success. */
  const act = useCallback(
    (body: ParlayAction): Promise<boolean> =>
      Promise.resolve()
        .then(() => {
          setBusy(true);
          return api("/api/parlay", { body: { ...context, ...body } });
        })
        .then(() => load())
        .then(
          () => {
            toast.success("Saved to the league");
            return true;
          },
          (e: unknown) => {
            toast.error(message(e));
            return false;
          },
        )
        .finally(() => setBusy(false)),
    [context, load],
  );

  const setTab = (next: ParlayTab) => {
    setData(null);
    setTabState(next);
  };

  const setSeason = (next: string) => {
    setSeasonState(next);
    setWeek("current");
  };

  return { data, error, busy, loadedAt, tab, setTab, season, setSeason, week, setWeek, load, act, context };
}

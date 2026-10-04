// useOdds: keyed requests, the page-lifetime cache, error retry and stale-key suppression.
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOdds } from "@/components/parlay/use-odds";
import { jsonError, mockFetch } from "./helpers";

const context = { season: 2026, week: 3 };
const posted = { book: "DraftKings", updated: 1, options: [{ side: "Over", odds: -110 }] };

describe("useOdds", () => {
  it("fetches once per game/market, serves repeats from cache and ignores disabled lookups", async () => {
    const { calls } = mockFetch({
      "/api/parlay": (_, url) => (url?.searchParams.get("market") === "totals" ? { ...posted, options: [] } : posted),
    });
    const { result, rerender } = renderHook(
      (p: { enabled: boolean; eventId: string; market: string }) => useOdds({ context, ...p }),
      {
        initialProps: { enabled: false, eventId: "g1", market: "h2h" },
      },
    );
    expect(result.current.oddsData).toBeNull();
    rerender({ enabled: true, eventId: "g1", market: "h2h" });
    await waitFor(() => expect(result.current.oddsData).toMatchObject(posted));
    expect(calls[0].url).toBe("/api/parlay?action=odds&season=2026&week=3&event=g1&market=h2h");
    rerender({ enabled: true, eventId: "g1", market: "totals" });
    await waitFor(() => expect(result.current.oddsData?.options).toEqual([]));
    // Switching back is served from the cache: no third request, and never a stale market's data.
    rerender({ enabled: true, eventId: "g1", market: "h2h" });
    expect(result.current.oddsData).toBeNull();
    await waitFor(() => expect(result.current.oddsData).toMatchObject(posted));
    expect(calls).toHaveLength(2);
    rerender({ enabled: true, eventId: "", market: "h2h" });
    expect(result.current.oddsData).toBeNull();
    expect(result.current.loadingOdds).toBe(false);
  });

  it("reports errors and retries on demand", async () => {
    let fail = true;
    mockFetch({ "/api/parlay": () => (fail ? jsonError(400, "Odds feed needs a free API key.") : posted) });
    const { result } = renderHook(() => useOdds({ enabled: true, context, eventId: "g9", market: "spreads" }));
    await waitFor(() => expect(result.current.oddsError).toBe("Odds feed needs a free API key."));
    fail = false;
    act(() => result.current.retryOdds());
    await waitFor(() => expect(result.current.oddsData).toEqual(posted));
    expect(result.current.oddsError).toBe("");
  });

  it("drops a response that arrives after the component unmounted", async () => {
    let resolve!: (r: Response) => void;
    mockFetch({ "/api/parlay": () => new Promise<Response>((r) => (resolve = r)) });
    const { result, unmount } = renderHook(() => useOdds({ enabled: true, context, eventId: "g8", market: "h2h" }));
    await waitFor(() => expect(result.current.loadingOdds).toBe(true));
    unmount();
    resolve(Response.json(posted));
    await new Promise((r) => setTimeout(r, 0));
  });
});

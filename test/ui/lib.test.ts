// Pure front-end helpers: the API wrapper, formatting, the popup preference store and class merging.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { kickoff, money, resultAccent, resultSymbol, resultTone, signed } from "@/components/parlay/format";
import { currentSeason } from "@/components/parlay/use-parlay";
import { api, ApiError } from "@/lib/api";
import { setPopupEnabled, usePopupEnabled } from "@/lib/popup-store";
import { cn } from "@/lib/utils";
import { mockFetch } from "./helpers";

describe("api", () => {
  it("GETs by default, POSTs JSON bodies, and surfaces server error messages", async () => {
    const { calls } = mockFetch({
      "/api/ok": () => ({ ok: true }),
      "POST /api/echo": (init) => JSON.parse(String(init?.body)),
      "/api/empty": () => new Response("", { status: 200 }),
      "/api/bad": () => new Response(JSON.stringify({ error: "Nope." }), { status: 400 }),
      "/api/html": () => new Response("<html>", { status: 502 }),
    });
    expect(await api("/api/ok")).toEqual({ ok: true });
    expect(await api("/api/echo", { body: { a: 1 } })).toEqual({ a: 1 });
    expect(calls[1].init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(await api("/api/empty")).toBeNull();
    await expect(api("/api/bad")).rejects.toMatchObject({ status: 400, message: "Nope." });
    await expect(api("/api/html")).rejects.toThrow("Request failed (502).");
    await expect(api("/api/missing", { method: "DELETE" })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("format", () => {
  it("formats money, kickoffs, signed numbers and result styling", () => {
    expect(money(25)).toBe("$25.00");
    expect(money(1234.5)).toBe("$1,234.50");
    expect(kickoff("2026-09-27T17:00:00Z")).toBe("Sep 27, 1:00 PM ET");
    expect(kickoff(Date.parse("2026-12-01T01:30:00Z"))).toBe("Nov 30, 8:30 PM ET");
    expect(signed(1.5)).toBe("+1.50");
    expect(signed(-0.25)).toBe("-0.25");
    expect(signed(0)).toBe("0.00");
    expect(["won", "lost", "push", "void", "pending"].map((r) => resultSymbol(r as never))).toEqual([
      "✓",
      "×",
      "=",
      "—",
      "?",
    ]);
    expect(resultTone("won")).toContain("success");
    expect(resultTone("lost")).toContain("destructive");
    expect(resultTone("review")).toContain("accent");
    expect(resultTone("pending")).toContain("muted");
    expect(resultAccent("won")).toBe("border-l-success");
    expect(resultAccent("lost")).toBe("border-l-destructive");
    expect(resultAccent("review")).toBe("border-l-accent");
    expect(resultAccent("push")).toBe("border-l-transparent");
  });

  it("rolls the season over in March", () => {
    expect(currentSeason(new Date(2027, 1, 15))).toBe(2026);
    expect(currentSeason(new Date(2027, 2, 1))).toBe(2027);
  });
});

describe("popup store", () => {
  afterEach(() => localStorage.clear());

  it("defaults from config, persists per browser and notifies subscribers", () => {
    const { result } = renderHook(() => usePopupEnabled());
    expect(result.current).toBe(true);
    act(() => setPopupEnabled(false));
    expect(result.current).toBe(false);
    expect(localStorage.getItem("popupEnabled")).toBe("false");
    act(() => {
      localStorage.setItem("popupEnabled", "true");
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(result.current).toBe(true);
  });

  it("survives a blocked localStorage", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => usePopupEnabled());
    expect(result.current).toBe(true);
    act(() => setPopupEnabled(false));
    expect(result.current).toBe(true);
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("cn", () => {
  it("merges Tailwind classes", () => {
    const hidden = [] as string[];
    expect(cn("p-2", hidden, "p-4")).toBe("p-4");
  });
});

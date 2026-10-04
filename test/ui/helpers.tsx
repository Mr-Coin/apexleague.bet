// Shared render helpers and fixtures for the React suite.
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ClubhouseData, PerformanceRecord, PickRow } from "@/components/parlay/types";
import { AuthContext, type AuthStatus, type AuthValue } from "@/lib/auth-context";

export function authValue(status: AuthStatus = "member", over: Partial<AuthValue> = {}): AuthValue {
  return {
    status,
    isCommissioner: status === "commissioner",
    login: vi.fn(async () => {}),
    elevate: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
    ...over,
  };
}

interface Options extends Omit<RenderOptions, "wrapper"> {
  auth?: AuthValue;
  route?: string;
}

/** Render inside the router, tooltip provider and a stubbed auth context. */
export function renderApp(ui: ReactElement, { auth = authValue(), route = "/", ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={auth}>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}

/** Stub `fetch` with a router keyed by method + path prefix; unmatched requests 404. */
export function mockFetch(
  routes: Record<string, (init?: RequestInit, url?: URL) => unknown | Response | Promise<unknown>>,
) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input instanceof Request ? input.url : input), "https://test.invalid");
    const method = init?.method ?? "GET";
    calls.push({ url: url.pathname + url.search, init });
    const key = Object.keys(routes).find((k) => {
      const [m, p] = k.includes(" ") ? k.split(" ") : ["GET", k];
      return m === method && url.pathname === p;
    });
    if (!key) return new Response(JSON.stringify({ error: "Not found." }), { status: 404 });
    const out = await routes[key](init, url);
    return out instanceof Response ? out : Response.json(out);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export const jsonError = (status: number, error: string) => new Response(JSON.stringify({ error }), { status });

export const NOW = Date.parse("2026-09-24T14:00:00Z"); // Thursday of 2026 Week 3
export const KICKOFF = "2026-09-27T17:00:00Z";
export const DEADLINE = Date.parse(KICKOFF);

export const game = {
  id: "g1",
  name: "HOU @ IND",
  home: "Indianapolis Colts",
  away: "Houston Texans",
  date: KICKOFF,
  completed: false,
  state: "Scheduled",
  homeScore: 0,
  awayScore: 0,
};
export const thursdayGame = { ...game, id: "tnf", name: "TNF", date: "2026-09-24T23:15:00Z" };

export function pickRow(over: Omit<Partial<PickRow>, "pick"> & { pick?: Partial<PickRow["pick"]> } = {}): PickRow {
  const { pick, ...rest } = over;
  return {
    id: "p1",
    season: 2026,
    week: 3,
    team_id: 901,
    result: "pending",
    actual: null,
    updated: NOW,
    ...rest,
    pick: {
      eventId: game.id,
      game: game.name,
      kickoff: KICKOFF,
      market: "h2h",
      player: "",
      side: game.home,
      line: null,
      odds: -110,
      book: "DraftKings",
      source: "manual",
      sourceTime: NOW,
      ...pick,
    },
  };
}

export function clubhouse(over: Partial<ClubhouseData> = {}): ClubhouseData {
  return {
    allTime: null,
    performance: null,
    availableSeasons: [2026, 2025],
    season: 2026,
    week: 3,
    activeWeek: 3,
    league: {
      teams: [
        { id: 901, personName: "Alex One", name: "Team One", wins: 2, losses: 1, ties: 0, points: 300, rank: 1 },
        { id: 902, personName: null, name: "Team Two", wins: 1, losses: 2, ties: 0, points: 250, rank: 2 },
      ],
      matchups: [],
      week: 3,
      updated: NOW,
      stale: false,
      previousSeasons: [2025],
    },
    games: [game, thursdayGame],
    scheduleError: "",
    picks: [],
    deadline: DEADLINE,
    locked: false,
    funder: { ids: [901], score: 80.5, tie: false, names: "Alex One" },
    members: [{ name: "Member Three", team_id: 903 }],
    history: [],
    user: { name: "", admin: false, teamId: null },
    connections: { espn: true, odds: true },
    credits: 3,
    ...over,
  };
}

export function performanceRecord(over: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    key: "k1",
    name: "Alex One",
    wins: 2,
    losses: 1,
    pushes: 0,
    voids: 0,
    pending: 1,
    priced: 3,
    missingOdds: 0,
    estimated: 0,
    units: 0.82,
    netWins: 1,
    timeline: [
      {
        season: 2026,
        week: 2,
        label: "2026 W2",
        result: "won",
        pick: pickRow().pick,
        odds: -110,
        estimated: false,
        delta: 0.91,
        units: 0.91,
        netWins: 1,
      },
      {
        season: 2026,
        week: 3,
        label: "2026 W3",
        result: "lost",
        pick: pickRow().pick,
        odds: 120,
        estimated: true,
        delta: -1,
        units: -0.09,
        netWins: 0,
      },
      {
        season: 2026,
        week: 4,
        label: "2026 W4",
        result: "pending",
        pick: pickRow().pick,
        odds: null,
        estimated: false,
        delta: null,
        units: null,
        netWins: null,
      },
    ],
    streak: 1,
    streakResult: "lost",
    longestWin: 1,
    longestLoss: 1,
    winRate: 66.7,
    roi: 27.3,
    averageUnits: 0.27,
    averageDecimal: 2.05,
    ...over,
  };
}

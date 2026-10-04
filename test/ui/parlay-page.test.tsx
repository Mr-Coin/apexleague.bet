// ParlayPage end to end through useParlay: loading, tabs, pick/delete/review actions, locking and refresh.
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ParlayPage from "@/components/parlay/ParlayPage";
import { authValue, clubhouse, DEADLINE, game, jsonError, mockFetch, NOW, pickRow, renderApp } from "./helpers";

const ok = (over = {}) => clubhouse(over);
const posted = (calls: { url: string; init?: RequestInit }[]) =>
  calls.filter((c) => c.init?.method === "POST").map((c) => JSON.parse(String(c.init?.body)));

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
  vi.spyOn(toast, "success").mockImplementation(() => "t");
  vi.spyOn(toast, "error").mockImplementation(() => "t");
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe("ParlayPage", () => {
  it("loads the current week, shows the funder and surfaces load errors", async () => {
    let fail = false;
    const { calls } = mockFetch({ "/api/parlay": () => (fail ? jsonError(400, "Invalid season") : ok()) });
    renderApp(<ParlayPage />);
    expect(screen.getByRole("heading", { name: "Week —" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Week 3" })).toBeInTheDocument();
    expect(calls[0].url).toBe("/api/parlay?season=2026");
    expect(screen.getByText("Alex One")).toBeInTheDocument();
    expect(screen.getByText("0 / 2 legs submitted")).toBeInTheDocument();
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Make my pick/ })).toBeEnabled();
    expect(screen.queryByRole("tab", { name: "Admin" })).not.toBeInTheDocument();
    fail = true;
    await setup().click(screen.getByRole("button", { name: "Refresh parlay" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid season");
    // Existing data stays on screen behind the error.
    expect(screen.getByRole("heading", { name: "Week 3" })).toBeInTheDocument();
  });

  it("flags missing connections and lets an admin jump to the setup tab", async () => {
    const user = setup();
    mockFetch({ "/api/parlay": () => ok({ connections: { espn: false, odds: false } }) });
    renderApp(<ParlayPage />, { auth: authValue("commissioner") });
    expect(await screen.findByText(/ESPN connection needed/)).toBeInTheDocument();
    expect(screen.getByText(/Odds key needed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /View setup/ }));
    expect(await screen.findByText("COMMISSIONER DESK")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Admin" })).toHaveAttribute("aria-selected", "true");
  });

  it("saves a manual pick, relabels the button, then deletes the leg", async () => {
    const user = setup();
    let picks: ReturnType<typeof pickRow>[] = [];
    const { calls } = mockFetch({
      "/api/parlay": () => ok({ picks }),
      "POST /api/parlay": (init) => {
        const body = JSON.parse(String(init?.body));
        picks = body.action === "pick" ? [pickRow({ team_id: Number(body.team), pick: body.pick })] : [];
        return { ok: true };
      },
    });
    renderApp(<ParlayPage />);
    await user.click(await screen.findByRole("button", { name: /Make my pick/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Choose your name" }));
    await user.click(await screen.findByRole("option", { name: "Team Two" }));
    await user.click(within(dialog).getByRole("tab", { name: "Enter manually" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Select a game" }));
    await user.click(await screen.findByRole("option", { name: /HOU @ IND/ }));
    await user.click(within(dialog).getByRole("combobox", { name: "Selection" }));
    await user.click(await screen.findByRole("option", { name: game.home }));
    await user.click(within(dialog).getByRole("button", { name: /Save my leg/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posted(calls)[0]).toMatchObject({
      season: 2026,
      week: 3,
      action: "pick",
      team: "902",
      pick: { eventId: "g1", market: "h2h", side: game.home },
    });
    expect(toast.success).toHaveBeenCalledWith("Saved to the league");
    expect(await screen.findByText("1 / 2 legs submitted")).toBeInTheDocument();
    expect(screen.getByText("Team Two")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change my pick/ })).toBeEnabled();
    // Reopening prefills the existing leg for editing.
    await user.click(screen.getByRole("button", { name: /Change my pick/ }));
    expect(within(await screen.findByRole("dialog")).getByRole("tab", { name: "Enter manually" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Escape}");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(posted(calls).at(-1)).toMatchObject({ action: "deletePick", team: "902" }));
    expect(await screen.findByText("No picks yet.")).toBeInTheDocument();
  });

  it("toasts a failed action and keeps the dialog open", async () => {
    const user = setup();
    mockFetch({
      "/api/parlay": () => ok(),
      "POST /api/parlay": () => jsonError(400, "That exact leg has already been selected."),
    });
    renderApp(<ParlayPage />);
    await user.click(await screen.findByRole("button", { name: /Make my pick/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Choose your name" }));
    await user.click(await screen.findByRole("option", { name: "Alex One" }));
    await user.click(within(dialog).getByRole("tab", { name: "Enter manually" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Select a game" }));
    await user.click(await screen.findByRole("option", { name: /HOU @ IND/ }));
    await user.click(within(dialog).getByRole("button", { name: /Save my leg/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("That exact leg has already been selected."));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("lets a commissioner review a leg and names teams from members or ids when ESPN lacks them", async () => {
    const user = setup();
    const { calls } = mockFetch({
      "/api/parlay": () =>
        ok({
          picks: [pickRow({ team_id: 903, result: "won" }), pickRow({ id: "p2", team_id: 904 })],
          league: { ...ok().league, teams: [] },
        }),
      "POST /api/parlay": () => ({ ok: true }),
    });
    renderApp(<ParlayPage />, { auth: authValue("commissioner") });
    expect(await screen.findByText("Member Three")).toBeInTheDocument();
    expect(screen.getByText("Team 904")).toBeInTheDocument();
    expect(screen.getByText("2 / — legs submitted")).toBeInTheDocument();
    expect(screen.getByText(/Same-game legs detected/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Review result" })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Required for the audit trail"), "Sportsbook graded");
    await user.click(within(dialog).getByRole("button", { name: "Save reviewed result" }));
    await waitFor(() =>
      expect(posted(calls)[0]).toMatchObject({ action: "grade", id: "p1", result: "won", reason: "Sportsbook graded" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("locks the slip from the server flag, or when the deadline passes while open", async () => {
    mockFetch({ "/api/parlay": () => ok({ locked: true, picks: [pickRow({ result: "won" })] }) });
    const first = renderApp(<ParlayPage />);
    expect(await first.findByRole("button", { name: "Picks locked" })).toBeDisabled();
    expect(first.getByText("Won")).toBeInTheDocument();
    expect(first.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    first.unmount();

    mockFetch({ "/api/parlay": () => ok({ deadline: NOW + 60_000 }) });
    renderApp(<ParlayPage />);
    await screen.findByRole("heading", { name: "Week 3" });
    expect(screen.getByRole("button", { name: /Make my pick/ })).toBeEnabled();
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(screen.getByRole("button", { name: "Picks locked" })).toBeDisabled();
  });

  it("disables new picks when no games remain and explains why", async () => {
    mockFetch({ "/api/parlay": () => ok({ games: [], scheduleError: "NFL schedule is unavailable." }) });
    const { unmount } = renderApp(<ParlayPage />);
    await screen.findByRole("heading", { name: "Week 3" });
    expect(screen.getByRole("button", { name: /Make my pick/ })).toBeDisabled();
    expect(screen.getByText("The schedule could not load. Tap refresh to retry.")).toBeInTheDocument();
    unmount();
    mockFetch({
      "/api/parlay": () =>
        ok({ games: [{ ...game, date: "2026-09-20T17:00:00Z" }], deadline: DEADLINE + 7 * 86400000 }),
    });
    renderApp(<ParlayPage />);
    expect(await screen.findByText(/No games left to start/)).toBeInTheDocument();
  });

  it("drives the history tab with season and week queries and refreshes on an interval", async () => {
    const user = setup();
    const { calls } = mockFetch({
      "/api/parlay": () => ok({ history: [{ season: 2026, week: 2, team_id: 901, result: "won" }] }),
    });
    renderApp(<ParlayPage />);
    await screen.findByRole("heading", { name: "Week 3" });
    await user.click(screen.getByRole("tab", { name: "History" }));
    await waitFor(() => expect(calls.at(-1)?.url).toBe("/api/parlay?season=2026&stats=1"));
    expect(await screen.findByText("WEEK 2")).toBeInTheDocument();
    await user.click(screen.getByText("WEEK 2"));
    await waitFor(() => expect(calls.at(-1)?.url).toBe("/api/parlay?season=2026&week=2&stats=1"));
    await user.click(screen.getByRole("combobox", { name: "Season" }));
    await user.click(await screen.findByRole("option", { name: "2025" }));
    await waitFor(() => expect(calls.at(-1)?.url).toBe("/api/parlay?season=2025&stats=1"));
    const before = calls.length;
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(calls.length).toBe(before + 1);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(calls.length).toBe(before + 1);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("ignores a slow response that arrives after a newer load", async () => {
    const user = setup();
    const pending: ((r: Response) => void)[] = [];
    mockFetch({ "/api/parlay": () => new Promise<Response>((r) => pending.push(r)) });
    renderApp(<ParlayPage />);
    await waitFor(() => expect(pending).toHaveLength(1));
    await user.click(screen.getByRole("tab", { name: "History" }));
    await waitFor(() => expect(pending).toHaveLength(2));
    pending[1](Response.json(ok({ week: 2 })));
    expect(await screen.findByRole("heading", { name: "Week 2" })).toBeInTheDocument();
    pending[0](Response.json(ok({ week: 9 })));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(screen.getByRole("heading", { name: "Week 2" })).toBeInTheDocument();
  });
});

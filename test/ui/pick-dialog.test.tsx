// PickDialog: browsing feed odds (loading, errors, filtering, selection) and the manual form per market.
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PickDialog } from "@/components/parlay/PickDialog";
import { clubhouse, game, jsonError, mockFetch, NOW, pickRow, renderApp, thursdayGame } from "./helpers";

const data = clubhouse();
const teamName = (id: number) => (id === 901 ? "Alex One" : "Team " + id);
let week = 0;
const props = {
  open: true,
  onOpenChange: vi.fn(),
  data,
  context: { season: 2026, week: 3 },
  games: [
    game,
    {
      ...game,
      id: "g2",
      name: "DAL @ NYG",
      home: "New York Giants",
      away: "Dallas Cowboys",
      date: "2026-09-27T20:25:00Z",
    },
  ],
  teamName,
  editing: null,
  initialTeam: "901",
  locked: false,
  busy: false,
  now: NOW,
  onSave: vi.fn(async () => true),
};
const feed = {
  book: "DraftKings",
  updated: NOW,
  options: [
    { player: "Josh Downs", side: "Over", line: 4.5, odds: -120, book: "DraftKings", sourceTime: NOW - 1000 },
    { player: "Josh Downs", side: "Under", line: 4.5, odds: -105 },
    { player: "Michael Pittman Jr.", side: "Over", line: 5.5, odds: 100 },
  ],
};

async function chooseGame(user: ReturnType<typeof userEvent.setup>, name = /HOU @ IND/) {
  await user.click(screen.getByRole("combobox", { name: "Select a game" }));
  await user.click(await screen.findByRole("option", { name }));
}
async function chooseMarket(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox", { name: "Market" }));
  await user.click(await screen.findByRole("option", { name: label }));
}

describe("PickDialog feed mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    props.context = { season: 2026, week: ++week };
  });

  it("loads odds for the chosen game and market, filters players and saves the selection", async () => {
    const user = userEvent.setup();
    const { calls } = mockFetch({
      "/api/parlay": (_, url) =>
        url?.searchParams.get("market") === "h2h"
          ? {
              ...feed,
              options: [
                { side: game.home, odds: -150 },
                { side: game.away, odds: 130 },
              ],
            }
          : feed,
    });
    renderApp(<PickDialog {...props} />);
    const save = screen.getByRole("button", { name: /Save my leg/ });
    expect(save).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Choose your name" })).toHaveTextContent("Alex One");
    await chooseGame(user);
    expect(await screen.findByText(/DraftKings · Snapshot/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Houston Texans/ })).toBeInTheDocument();
    await chooseMarket(user, "Receptions");
    expect(await screen.findByLabelText("Filter players in this market")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 of 3 selections · Receptions · HOU @ IND");
    await user.type(screen.getByLabelText("Filter players in this market"), "pittman jr");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3 selections");
    await user.type(screen.getByLabelText("Filter players in this market"), "zz");
    expect(screen.getByText(/No players match “pittman jrzz”/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("status")).toHaveTextContent("3 of 3 selections");
    await user.click(screen.getByRole("button", { name: /Josh Downs.*Over.*4\.5.*-120/ }));
    expect(save).toBeEnabled();
    await user.click(save);
    expect(props.onSave).toHaveBeenCalledWith("901", {
      eventId: "g1",
      market: "player_receptions",
      player: "Josh Downs",
      side: "Over",
      line: 4.5,
      odds: -120,
      book: "DraftKings",
      source: "feed",
      sourceTime: NOW - 1000,
    });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(calls.map((c) => new URL(c.url, "https://x").searchParams.get("market"))).toEqual([
      "h2h",
      "player_receptions",
    ]);
  });

  it("falls back to the snapshot book and time when an option omits them, and stays open on a failed save", async () => {
    const user = userEvent.setup();
    mockFetch({ "/api/parlay": () => feed });
    const onSave = vi.fn(async () => false);
    renderApp(<PickDialog {...props} onSave={onSave} />);
    await chooseGame(user);
    await chooseMarket(user, "Receptions");
    await user.click(await screen.findByRole("button", { name: /Josh Downs.*Under.*4\.5.*-105/ }));
    await user.click(screen.getByRole("button", { name: /Save my leg/ }));
    expect(onSave).toHaveBeenCalledWith(
      "901",
      expect.objectContaining({ book: "DraftKings", sourceTime: NOW, side: "Under" }),
    );
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("shows feed errors with retry, empty markets, and the missing-key note", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    mockFetch({
      "/api/parlay": () =>
        ++attempt === 1
          ? jsonError(400, "Data provider unavailable (503).")
          : { ...feed, options: [], message: "Nothing posted." },
    });
    renderApp(<PickDialog {...props} />);
    await chooseGame(user);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Data provider unavailable (503).");
    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Nothing posted.")).toBeInTheDocument();
    expect(screen.getByText(/Snapshot/)).toHaveTextContent(/^DraftKings · Snapshot/);
  });

  it("explains when the odds key is missing or no games remain", () => {
    const { rerender } = renderApp(
      <PickDialog {...props} data={clubhouse({ connections: { espn: true, odds: false } })} />,
    );
    expect(screen.getByText(/The free odds key has not been connected/)).toBeInTheDocument();
    rerender(<PickDialog {...props} games={[thursdayGame]} now={Date.parse("2026-09-28T00:00:00Z")} />);
    expect(screen.getByText(/No upcoming games are available for this week/)).toBeInTheDocument();
  });
});

describe("PickDialog manual mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    props.context = { season: 2026, week: ++week };
  });

  it("prefills from the row being edited and saves the manual fields", async () => {
    const user = userEvent.setup();
    mockFetch({});
    const editing = pickRow({
      pick: {
        market: "player_receptions",
        player: "Josh Downs",
        side: "Over",
        line: 4.5,
        odds: -156,
        book: "FanDuel",
        note: "hi",
      },
    });
    renderApp(<PickDialog {...props} editing={editing} />);
    expect(screen.getByRole("tab", { name: "Enter manually" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText("Full player name")).toHaveValue("Josh Downs");
    expect(screen.getByPlaceholderText("e.g. 4.5")).toHaveValue(4.5);
    expect(screen.getByPlaceholderText("-110 or +150")).toHaveValue(-156);
    expect(screen.getByDisplayValue("FanDuel")).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("e.g. 4.5"));
    await user.type(screen.getByPlaceholderText("e.g. 4.5"), "5.5");
    await user.click(screen.getByRole("button", { name: /Save my leg/ }));
    expect(props.onSave).toHaveBeenCalledWith(
      "901",
      expect.objectContaining({
        market: "player_receptions",
        player: "Josh Downs",
        side: "Over",
        line: 5.5,
        odds: -156,
        book: "FanDuel",
        source: "manual",
        note: "hi",
      }),
    );
  });

  it("adapts the form to each market and keeps sides in step with the game", async () => {
    const user = userEvent.setup();
    mockFetch({});
    renderApp(<PickDialog {...props} />);
    await user.click(screen.getByRole("tab", { name: "Enter manually" }));
    await chooseGame(user, /DAL @ NYG/);
    // Moneyline: team sides, no line, no player.
    expect(screen.queryByPlaceholderText("e.g. 4.5")).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Selection" }));
    expect(await screen.findByRole("option", { name: "Dallas Cowboys" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Dallas Cowboys" }));
    await chooseMarket(user, "Spread");
    expect(screen.getByRole("combobox", { name: "Selection" })).toHaveTextContent("New York Giants");
    expect(screen.getByPlaceholderText("e.g. 4.5")).toBeInTheDocument();
    await chooseMarket(user, "Anytime touchdown");
    expect(screen.getByRole("combobox", { name: "Selection" })).toHaveTextContent("Yes");
    expect(screen.getByPlaceholderText("Full player name")).toBeInTheDocument();
    await chooseMarket(user, "Game total");
    expect(screen.getByRole("combobox", { name: "Selection" })).toHaveTextContent("Over");
    await user.click(screen.getByRole("combobox", { name: "Selection" }));
    await user.click(await screen.findByRole("option", { name: "Under" }));
    await user.type(screen.getByPlaceholderText("e.g. 4.5"), "44.5");
    await user.click(screen.getByRole("button", { name: /Save my leg/ }));
    expect(props.onSave).toHaveBeenLastCalledWith(
      "901",
      expect.objectContaining({
        eventId: "g2",
        market: "totals",
        side: "Under",
        line: 44.5,
        odds: -110,
        book: "DraftKings",
      }),
    );
    await chooseMarket(user, "Other / manual review");
    await user.clear(screen.getByPlaceholderText("Describe the bet"));
    await user.type(screen.getByPlaceholderText("Describe the bet"), "First TD scorer");
    await user.click(screen.getByRole("button", { name: /Save my leg/ }));
    expect(props.onSave).toHaveBeenLastCalledWith(
      "901",
      expect.objectContaining({ market: "custom", side: "First TD scorer", line: null }),
    );
    // An empty line on a line market is saved as null rather than 0.
    await chooseMarket(user, "Spread");
    await user.clear(screen.getByPlaceholderText("e.g. 4.5"));
    await user.click(screen.getByRole("button", { name: /Save my leg/ }));
    expect(props.onSave).toHaveBeenLastCalledWith("901", expect.objectContaining({ market: "spreads", line: null }));
  });

  it("toasts instead of saving when nothing is selected in feed mode, and respects locks", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const error = vi.spyOn(toast, "error").mockImplementation(() => "t");
    mockFetch({ "/api/parlay": () => feed });
    const { rerender } = renderApp(<PickDialog {...props} />);
    await chooseGame(user);
    await screen.findByText(/Snapshot/);
    // Enable the button by selecting, then switch tabs so the selection clears before saving.
    await user.click(screen.getAllByRole("button", { name: /Josh Downs/ })[0]);
    await user.click(screen.getByRole("tab", { name: "Enter manually" }));
    await user.click(screen.getByRole("tab", { name: "Browse odds" }));
    expect(screen.getByRole("button", { name: /Save my leg/ })).toBeDisabled();
    rerender(<PickDialog {...props} locked />);
    expect(screen.getByRole("button", { name: /Save my leg/ })).toBeDisabled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("closes through the dialog's own controls", async () => {
    const user = userEvent.setup();
    mockFetch({});
    renderApp(<PickDialog {...props} />);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false));
  });
});

// Presentational parlay pieces: legs, funder, odds detail, leaderboards, admin desk, history and review.
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminTab } from "@/components/parlay/AdminTab";
import { AllTimeLosers } from "@/components/parlay/AllTimeLosers";
import { FunderCard } from "@/components/parlay/FunderCard";
import { HistoryTab } from "@/components/parlay/HistoryTab";
import { LegCard } from "@/components/parlay/LegCard";
import { OddsDetail } from "@/components/parlay/OddsDetail";
import { PerformanceHistory } from "@/components/parlay/PerformanceHistory";
import { ResultPill } from "@/components/parlay/ResultPill";
import { ReviewDialog } from "@/components/parlay/ReviewDialog";
import { clubhouse, performanceRecord, pickRow, renderApp } from "./helpers";

describe("LegCard", () => {
  it("shows the slip view with edit/delete gated by confirm, and review for admins", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn(),
      onDelete = vi.fn(),
      onReview = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const row = pickRow({ actual: "Waiting for a final result" });
    renderApp(
      <LegCard
        row={row}
        teamName="Alex One"
        editable
        canReview
        onEdit={onEdit}
        onDelete={onDelete}
        onReview={onReview}
      />,
    );
    expect(screen.getByText("Indianapolis Colts · Moneyline")).toBeInTheDocument();
    expect(screen.getByText("-110")).toBeInTheDocument();
    expect(screen.getByText("DraftKings · Entered manually")).toBeInTheDocument();
    expect(screen.getByText("Waiting for a final result")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(row);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(row);
    expect(confirm).toHaveBeenLastCalledWith("Delete the pick for Alex One?");
    await user.click(screen.getByRole("button", { name: "Review result" }));
    expect(onReview).toHaveBeenCalledWith(row);
    confirm.mockRestore();
  });

  it("renders a receipt with the odds estimate detail and no actions for members", () => {
    const row = pickRow({
      result: "won",
      pick: {
        odds: null,
        source: "feed",
        oddsEstimate: {
          odds: 180,
          source: "FOX Sports",
          url: "https://x.test",
          method: "Published line",
          confidence: "medium",
        },
      },
    });
    renderApp(<LegCard row={row} teamName="Alex One" variant="receipt" />);
    expect(screen.getByText("≈ +180 · estimate")).toBeInTheDocument();
    expect(screen.getByText("Published line")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FOX Sports" })).toHaveAttribute("href", "https://x.test");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("won")).toBeInTheDocument();
  });
});

describe("small pieces", () => {
  it("OddsDetail prefers the saved price; ResultPill styles by result", () => {
    renderApp(
      <>
        <OddsDetail pick={pickRow().pick} />
        <OddsDetail pick={{ ...pickRow().pick, odds: null }} />
        <ResultPill result="lost" />
      </>,
    );
    expect(screen.getByText("-110")).toBeInTheDocument();
    expect(screen.getByText("Odds unknown")).toBeInTheDocument();
    expect(screen.getByText("lost").className).toContain("destructive");
  });

  it("FunderCard explains who funds the ticket", () => {
    const { rerender } = renderApp(<FunderCard funder={{ ids: [1], score: 80.5, tie: false, names: "Alex One" }} />);
    expect(screen.getByText("Alex One")).toBeInTheDocument();
    expect(screen.getByText("Last week’s lowest score · 80.50 pts")).toBeInTheDocument();
    rerender(<FunderCard funder={{ ids: [1, 2], score: 80, tie: true, names: "A / B" }} />);
    expect(screen.getByText(/Tied low score/)).toBeInTheDocument();
    rerender(<FunderCard funder={null} />);
    expect(screen.getByText("Awaiting finalized scores")).toBeInTheDocument();
  });

  it("AdminTab reflects connection status and credits", () => {
    const { rerender } = renderApp(<AdminTab data={clubhouse()} />);
    expect(screen.getAllByText("Configured")).toHaveLength(2);
    expect(screen.getByText("3 / 450")).toBeInTheDocument();
    rerender(<AdminTab data={clubhouse({ connections: { espn: false, odds: false } })} />);
    expect(screen.getByText("Needs credentials")).toBeInTheDocument();
    expect(screen.getByText("Needs API key")).toBeInTheDocument();
  });
});

describe("AllTimeLosers and PerformanceHistory", () => {
  it("lists low-score leaders with season notes, or a loading/empty message", () => {
    const { rerender } = renderApp(
      <AllTimeLosers
        allTime={{
          leaders: [
            { name: "Alex", lowWeeks: 3, ties: 1, lowest: 61.2 },
            { name: "Sam", lowWeeks: 1, ties: 0, lowest: 70 },
          ],
          weeks: 4,
          seasons: [2026, 2025],
          unavailable: [2024],
        }}
        busy={false}
      />,
    );
    expect(screen.getByText("ESPN seasons: 2026, 2025 · 4 completed weeks")).toBeInTheDocument();
    expect(screen.getByText("Could not load 2024. Totals are incomplete.")).toBeInTheDocument();
    expect(screen.getByText("Lowest: 61.20 pts · 1 tied finishes")).toBeInTheDocument();
    expect(screen.getByText("Lowest: 70.00 pts")).toBeInTheDocument();
    rerender(<AllTimeLosers allTime={null} busy />);
    expect(screen.getByText("Loading league history…")).toBeInTheDocument();
    rerender(<AllTimeLosers allTime={{ leaders: [], weeks: 0, seasons: [], unavailable: [] }} busy={false} />);
    expect(screen.getByText("No completed low-score records available yet.")).toBeInTheDocument();
  });

  it("renders member cards sorted by units with streaks, metrics and the weekly strip", () => {
    const leaders = [
      performanceRecord({ key: "a", name: "Alex One", units: 0.82 }),
      performanceRecord({
        key: "b",
        name: "Sam Two",
        units: 2.5,
        streak: 2,
        streakResult: "won",
        estimated: 1,
        missingOdds: 1,
        pending: 0,
        pushes: 1,
        voids: 1,
      }),
      performanceRecord({
        key: "c",
        name: "Nobody",
        units: 0,
        priced: 0,
        streak: 0,
        streakResult: null,
        winRate: null,
        roi: null,
        averageUnits: null,
        averageDecimal: null,
        timeline: [],
      }),
    ];
    const { rerender } = renderApp(
      <PerformanceHistory
        performance={{ leaders, estimatedLeaders: leaders, seasons: [2026], picks: 6, unavailable: [2025] }}
        busy={false}
      />,
    );
    const cards = screen.getAllByRole("article");
    expect(cards.map((c) => within(c).getByRole("heading").textContent)).toEqual(["Sam Two", "Alex One", "Nobody"]);
    expect(within(cards[0]).getByText("2 wins")).toBeInTheDocument();
    expect(within(cards[1]).getByText("1 loss")).toBeInTheDocument();
    expect(within(cards[2]).getByText("Awaiting result")).toBeInTheDocument();
    expect(within(cards[2]).getAllByText("—")).toHaveLength(5);
    expect(
      within(cards[0]).getByText(/3 priced results · 1 estimated · 1 missing prices · 1 pushes · 1 voids/),
    ).toBeInTheDocument();
    expect(within(cards[1]).getByLabelText("2026 W3: lost, Indianapolis Colts · Moneyline")).toHaveTextContent("W3 ≈");
    expect(screen.getByText(/Some season identities are unavailable/)).toBeInTheDocument();
    rerender(<PerformanceHistory performance={null} busy />);
    expect(screen.getByText("Loading betting records…")).toBeInTheDocument();
    rerender(
      <PerformanceHistory
        performance={{ leaders: [], estimatedLeaders: [], seasons: [], picks: 0, unavailable: [] }}
        busy={false}
      />,
    );
    expect(screen.getByText("No saved picks yet.")).toBeInTheDocument();
  });
});

describe("HistoryTab", () => {
  const props = {
    busy: false,
    season: "2026",
    week: "current",
    currentSeason: 2026,
    onSeason: vi.fn(),
    onWeek: vi.fn(),
    onRefresh: vi.fn(),
    isAdmin: false,
    teamName: (id: number) => "Team " + id,
    onReview: vi.fn(),
  };

  it("summarises each week from history and lists the selected week's receipts", async () => {
    const user = userEvent.setup();
    const data = clubhouse({
      picks: [pickRow({ result: "won" }), pickRow({ id: "p2", team_id: 902, result: "lost" })],
      history: [
        { season: 2026, week: 3, team_id: 901, result: "won" },
        { season: 2026, week: 3, team_id: 902, result: "lost" },
        { season: 2026, week: 2, team_id: 901, result: "won" },
        { season: 2026, week: 2, team_id: 902, result: "won" },
        { season: 2026, week: 1, team_id: 901, result: "pending" },
      ],
    });
    renderApp(<HistoryTab {...props} data={data} />);
    expect(screen.getByText("WEEK 3").closest("button")).toHaveTextContent("Lost1 won · 1 lost · 2 submitted");
    expect(screen.getByText("WEEK 2").closest("button")).toHaveTextContent("Won");
    expect(screen.getByText("WEEK 1").closest("button")).toHaveTextContent("Pending");
    await user.click(screen.getByText("WEEK 2"));
    expect(props.onWeek).toHaveBeenCalledWith("2");
    expect(screen.getByRole("heading", { name: "Week 3 · 2026 · Lost" })).toBeInTheDocument();
    expect(screen.getAllByText(/Moneyline/)).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Refresh history" }));
    expect(props.onRefresh).toHaveBeenCalled();
    await user.click(screen.getByRole("combobox", { name: "Week" }));
    await user.click(await screen.findByRole("option", { name: "Week 5" }));
    expect(props.onWeek).toHaveBeenLastCalledWith("5");
    await user.click(screen.getByRole("combobox", { name: "Season" }));
    await user.click(await screen.findByRole("option", { name: "2025" }));
    expect(props.onSeason).toHaveBeenCalledWith("2025");
  });

  it("shows the clean-slate state before any picks exist", () => {
    renderApp(<HistoryTab {...props} data={null} busy />);
    expect(screen.getByText("A clean slate.")).toBeInTheDocument();
    expect(screen.getByText("No picks saved for this week.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh history" })).toBeDisabled();
  });
});

describe("ReviewDialog", () => {
  it("requires a reason, defaults from the current result, and closes after a successful save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onClose = vi.fn();
    const row = pickRow({ result: "lost" });
    renderApp(<ReviewDialog row={row} onClose={onClose} busy={false} onSave={onSave} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Indianapolis Colts · Moneyline");
    expect(screen.getByRole("combobox", { name: "Result" })).toHaveTextContent("lost");
    const save = screen.getByRole("button", { name: "Save reviewed result" });
    expect(save).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Required for the audit trail"), "DK");
    expect(save).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Required for the audit trail"), " settled");
    await user.click(screen.getByRole("combobox", { name: "Result" }));
    await user.click(await screen.findByRole("option", { name: "void" }));
    await user.click(save);
    expect(onSave).toHaveBeenCalledWith("p1", "void", "DK settled");
    expect(onClose).not.toHaveBeenCalled();
    await user.click(save);
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("stays closed without a row", () => {
    renderApp(<ReviewDialog row={null} onClose={vi.fn()} busy={false} onSave={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

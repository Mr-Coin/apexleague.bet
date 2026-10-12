import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { WeeklyLowHistogram } from "../../src/components/parlay/WeeklyLowHistogram";
it("shows record identity and a provisional comparison without adding it to history", () => {
  render(<WeeklyLowHistogram busy={false} allTime={{ leaders: [], weeks: 1, seasons: [2025], unavailable: [], weeklyLows: [{ season: 2025, week: 4, score: 42.12, tie: false, people: [{ name: "Alex" }] }], currentLow: { season: 2026, week: 5, score: 39, tie: false, people: [{ name: "Stu" }] } }} />);
  expect(screen.getByText("42.12")).toBeInTheDocument();
  expect(screen.getByText(/Alex · 2025 Week 4/)).toBeInTheDocument();
  expect(screen.getByText(/This week · live, not final/)).toBeInTheDocument();
  expect(screen.getByText(/0 of 1 historical weekly lows/)).toBeInTheDocument();
});
it("discloses partial coverage rather than claiming an all-time record", () => {
  render(<WeeklyLowHistogram busy={false} allTime={{ leaders: [], weeks: 1, seasons: [2025], unavailable: [], histogramUnavailable: [2024], weeklyLows: [{ season: 2025, week: 1, score: 40, tie: false, people: [{ name: "Alex" }] }] }} />);
  expect(screen.getByText("Lowest in available history")).toBeInTheDocument();
  expect(screen.getByText(/Incomplete coverage: 2024/)).toBeInTheDocument();
});

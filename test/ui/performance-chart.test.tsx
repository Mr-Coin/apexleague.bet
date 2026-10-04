// The recharts line inside PerformanceHistory only lays out with a measurable container; give it one.
import { fireEvent, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PerformanceHistory } from "@/components/parlay/PerformanceHistory";
import { performanceRecord, renderApp } from "./helpers";

const rect = { width: 600, height: 128, top: 0, left: 0, right: 600, bottom: 128, x: 0, y: 0, toJSON() {} };
let original: typeof HTMLElement.prototype.getBoundingClientRect;

beforeAll(() => {
  original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = () => rect as DOMRect;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 600 });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 128 });
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = original;
});

describe("PerformanceHistory chart", () => {
  it("draws a result dot per priced week and a tooltip on hover", async () => {
    const record = performanceRecord();
    renderApp(
      <PerformanceHistory
        performance={{ leaders: [record], estimatedLeaders: [record], seasons: [2026], picks: 3, unavailable: [] }}
        busy={false}
      />,
    );
    const svg = await screen.findByRole("application");
    const titles = [...svg.querySelectorAll("title")].map((t) => t.textContent);
    expect(titles).toEqual(expect.arrayContaining(["2026 W2: won", "2026 W3: lost"]));
    expect(titles).not.toContain("2026 W4: pending");
    fireEvent.mouseMove(svg, { clientX: 120, clientY: 60 });
    const tip = await screen.findByText(/u total/);
    expect(tip.parentElement).toHaveTextContent(/2026 W[23] · (won|lost)/);
    expect(tip.parentElement).toHaveTextContent("Indianapolis Colts · Moneyline");
  });
});

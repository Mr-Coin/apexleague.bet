// League content sections render their configured content and local interactions work.
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DraftSection from "@/components/DraftSection";
import Footer from "@/components/Footer";
import HistorySection from "@/components/HistorySection";
import KeepersSection from "@/components/KeepersSection";
import ProposalsSection from "@/components/ProposalsSection";
import RulesSection from "@/components/RulesSection";
import TeamsSection from "@/components/TeamsSection";
import NotFound from "@/pages/NotFound";
import { getActiveProposals, PROPOSALS } from "@/config/proposals";
import { getTeamsByDraftOrder, TEAMS } from "@/config/teams";
import { renderApp } from "./helpers";

describe("content sections", () => {
  it("TeamsSection lists every team in draft order with its badges", async () => {
    const user = userEvent.setup();
    renderApp(<TeamsSection />);
    const ordered = getTeamsByDraftOrder();
    expect(ordered.length).toBe(TEAMS.length);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings.filter((h) => h !== "League Teams")).toEqual(ordered.map((t) => t.name));
    expect(screen.getByText("Draft #1")).toBeInTheDocument();
    // Badge tooltips and the mobile tap-through popup.
    const badge = document.querySelector("[style*='border-color']") as HTMLElement;
    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true });
    await user.click(badge);
    const close = await screen.findByRole("button", { name: "Close" });
    await user.click(close);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    await user.click(badge);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("KeepersSection switches seasons and exports the selected year", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:csv");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderApp(<KeepersSection />);
    expect(screen.getByText("Keeper Selections")).toBeInTheDocument();
    const y2024 = screen.getByRole("button", { name: "2024" });
    expect(y2024.className).not.toContain("bg-primary");
    await user.click(y2024);
    expect(y2024.className).toContain("bg-primary");
    const csv = screen.getAllByRole("button").find((b) => /csv|export/i.test(b.textContent ?? ""))!;
    await user.click(csv);
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("HistorySection toggles past seasons open and closed", async () => {
    const user = userEvent.setup();
    renderApp(<HistorySection />);
    expect(screen.getByText("Final Standings")).toBeInTheDocument();
    const triggers = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-expanded"));
    expect(triggers.length).toBeGreaterThanOrEqual(2);
    const before = triggers.map((t) => t.getAttribute("aria-expanded"));
    for (const t of triggers) await user.click(t);
    expect(triggers.map((t) => t.getAttribute("aria-expanded"))).not.toEqual(before);
  });

  it("ProposalsSection renders the active proposals from config", () => {
    renderApp(<ProposalsSection />);
    expect(screen.getByText("Active Proposals")).toBeInTheDocument();
    for (const p of getActiveProposals()) expect(screen.getByText(p.title)).toBeInTheDocument();
    expect(getActiveProposals().length).toBeLessThanOrEqual(PROPOSALS.length);
  });

  it("RulesSection shows the rules and any draft notices from config", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderApp(<RulesSection />);
    expect(screen.getByText("League Rules")).toBeInTheDocument();
    expect(screen.getByText("Punishment Options")).toBeInTheDocument();
    const meet = screen.queryByRole("button", { name: /join|meet|link/i });
    if (meet) {
      await user.click(meet);
      expect(open).toHaveBeenCalled();
    }
    open.mockRestore();
  });

  it("DraftSection switches views and exports a CSV", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:csv");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderApp(<DraftSection />);
    const buttons = screen.getAllByRole("button");
    for (const b of buttons) await user.click(b);
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("Footer and NotFound render their links", () => {
    renderApp(
      <>
        <Footer />
        <NotFound />
      </>,
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toHaveAttribute("href", "/");
    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getAllByRole("link").length).toBeGreaterThan(0);
  });
});

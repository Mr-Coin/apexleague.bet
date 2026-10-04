// RulesSection with the config-gated draft notices switched on (the live config keeps them off).
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type * as Draft from "@/config/draft";
import { renderApp } from "./helpers";

vi.mock("@/config/draft", async (importOriginal) => {
  const actual = await importOriginal<typeof Draft>();
  return {
    DRAFT_CONFIG: { ...actual.DRAFT_CONFIG, showDraftNotification: true, showDraftConclusion: true },
  };
});

describe("RulesSection draft notices", () => {
  it("renders the notification with its meeting link and the conclusion banner", async () => {
    const { default: RulesSection } = await import("@/components/RulesSection");
    const { DRAFT_CONFIG } = await import("@/config/draft");
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderApp(<RulesSection />);
    expect(screen.getByText(DRAFT_CONFIG.draftNotification.title)).toBeInTheDocument();
    expect(screen.getByText(DRAFT_CONFIG.draftConclusion.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: DRAFT_CONFIG.draftNotification.meetLinkText }));
    expect(open).toHaveBeenCalledWith(DRAFT_CONFIG.draftNotification.meetLink, "_blank");
    open.mockRestore();
  });
});

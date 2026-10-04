// Header navigation, the settings popover (popup switch + commissioner PIN) and the retro popup.
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApexHeader from "@/components/ApexHeader";
import Layout from "@/components/Layout";
import RetroPopup from "@/components/RetroPopup";
import { POPUP_CONFIG } from "@/config/popup";
import { setPopupEnabled } from "@/lib/popup-store";
import { authValue, renderApp } from "./helpers";

describe("ApexHeader and Settings", () => {
  afterEach(() => localStorage.clear());

  it("highlights the active tab and logs out", async () => {
    const user = userEvent.setup();
    const auth = authValue("member");
    renderApp(<ApexHeader />, { auth, route: "/keepers" });
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Keepers" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it("opens settings, toggles the popup preference and closes on outside click or the X", async () => {
    const user = userEvent.setup();
    renderApp(<ApexHeader />);
    const toggle = screen.getByRole("button", { name: "Settings" });
    expect(screen.queryByText("Pop-up Notifications")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const sw = screen.getByRole("switch");
    expect(sw).toBeChecked();
    await user.click(sw);
    expect(sw).not.toBeChecked();
    expect(localStorage.getItem("popupEnabled")).toBe("false");
    await user.click(screen.getByRole("button", { name: "Close settings" }));
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    await user.click(toggle);
    await user.click(document.body);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("unlocks commissioner tools with the PIN and reports a bad PIN", async () => {
    const user = userEvent.setup();
    const elevate = vi
      .fn()
      .mockRejectedValueOnce(new Error("Incorrect commissioner PIN."))
      .mockRejectedValueOnce("x")
      .mockResolvedValue(undefined);
    renderApp(<ApexHeader />, { auth: authValue("member", { elevate }) });
    await user.click(screen.getByRole("button", { name: "Settings" }));
    const unlock = screen.getByRole("button", { name: "Unlock" });
    expect(unlock).toBeDisabled();
    await user.type(screen.getByPlaceholderText("PIN"), "000000{Enter}");
    expect(await screen.findByText("Incorrect commissioner PIN.")).toBeInTheDocument();
    await user.click(unlock);
    expect(await screen.findByText("Could not verify PIN.")).toBeInTheDocument();
    await user.click(unlock);
    expect(elevate).toHaveBeenCalledTimes(3);
    expect(screen.getByPlaceholderText("PIN")).toHaveValue("");
  });

  it("tells an elevated commissioner the tools are unlocked", async () => {
    const user = userEvent.setup();
    renderApp(<ApexHeader />, { auth: authValue("commissioner") });
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText(/Commissioner tools are unlocked/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("PIN")).not.toBeInTheDocument();
  });

  it("Layout renders the header, outlet and footer", () => {
    renderApp(<Layout />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

describe("RetroPopup", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("appears after the configured delay, swallows keys, and closes on Agree", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderApp(<RetroPopup />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(POPUP_CONFIG.delayMs));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(POPUP_CONFIG.message);
    const key = new KeyboardEvent("keydown", { key: "a", cancelable: true, bubbles: true });
    document.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);
    await user.click(screen.getByRole("button", { name: POPUP_CONFIG.disagreeButtonText }));
    expect(open).toHaveBeenCalledWith(POPUP_CONFIG.disagreeLink, "_blank", "noopener");
    await user.click(screen.getByRole("button", { name: POPUP_CONFIG.agreeButtonText }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open.mockRestore();
  });

  it("never schedules when the preference is off", async () => {
    setPopupEnabled(false);
    renderApp(<RetroPopup />);
    await act(() => vi.advanceTimersByTimeAsync(POPUP_CONFIG.delayMs * 2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

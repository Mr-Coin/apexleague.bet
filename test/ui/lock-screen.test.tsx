import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LockScreen from "@/components/LockScreen";
import { authValue, renderApp } from "./helpers";

describe("LockScreen", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("submits the league password and shows the server's message on failure", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const login = vi.fn().mockRejectedValueOnce(new Error("Incorrect password.")).mockResolvedValueOnce(undefined);
    renderApp(<LockScreen />, { auth: authValue("anonymous", { login }) });
    const unlock = screen.getByRole("button", { name: "Unlock" });
    expect(unlock).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Password"), "wrong");
    expect(unlock).toBeEnabled();
    await user.click(unlock);
    expect(login).toHaveBeenCalledWith("wrong");
    expect(await screen.findByRole("status")).toHaveTextContent("Incorrect password.");
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("Password"));
    await user.type(screen.getByPlaceholderText("Password"), "right{Enter}");
    expect(login).toHaveBeenLastCalledWith("right");
  });

  it("falls back to a generic error for non-Error rejections", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const login = vi.fn().mockRejectedValue("boom");
    renderApp(<LockScreen />, { auth: authValue("anonymous", { login }) });
    await user.type(screen.getByPlaceholderText("Password"), "x{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent("Error checking password.");
  });
});

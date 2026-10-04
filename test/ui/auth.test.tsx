// AuthProvider: session discovery, login/elevate/logout transitions and the visibility re-check.
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { jsonError, mockFetch } from "./helpers";

function Probe() {
  const { status, isCommissioner } = useAuth();
  return (
    <output>
      {status}:{String(isCommissioner)}
    </output>
  );
}

describe("AuthProvider", () => {
  it("throws when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
    vi.restoreAllMocks();
  });

  it("starts loading and resolves to anonymous when the session check fails", async () => {
    mockFetch({ "/api/auth/session": () => jsonError(500, "down") });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("loading:false");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("anonymous:false"));
  });

  it("walks through login, elevation and logout", async () => {
    let session = { authenticated: false, commissioner: false };
    const { calls } = mockFetch({
      "/api/auth/session": () => session,
      "POST /api/auth/login": () => ({ ok: true }),
      "POST /api/auth/commissioner": () => ({ ok: true }),
      "POST /api/auth/logout": () => ({ ok: true }),
    });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    await act(() => result.current.login("pw"));
    expect(result.current.status).toBe("member");
    expect(calls.at(-1)).toMatchObject({ url: "/api/auth/login" });
    await act(() => result.current.elevate("123456"));
    expect(result.current.isCommissioner).toBe(true);
    // Coming back to the tab re-reads the session so an expired PIN session drops back to member.
    session = { authenticated: true, commissioner: false };
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitFor(() => expect(result.current.status).toBe("member"));
    await act(() => result.current.logout());
    expect(result.current.status).toBe("anonymous");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(calls.filter((c) => c.url === "/api/auth/session")).toHaveLength(2);
  });

  it("recognises an existing commissioner session", async () => {
    mockFetch({ "/api/auth/session": () => ({ authenticated: true, commissioner: true }) });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("commissioner"));
  });
});

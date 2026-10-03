import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { AuthContext, type AuthStatus, type AuthValue } from "./auth-context";

interface SessionResponse {
  authenticated: boolean;
  commissioner: boolean;
}

function statusOf(s: SessionResponse): AuthStatus {
  return !s.authenticated ? "anonymous" : s.commissioner ? "commissioner" : "member";
}

const fetchStatus = (): Promise<AuthStatus> =>
  api<SessionResponse>("/api/auth/session")
    .then(statusOf)
    .catch(() => "anonymous" as const);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    setStatus(await fetchStatus());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      isCommissioner: status === "commissioner",
      refresh,
      login: async (password) => {
        await api("/api/auth/login", { body: { password } });
        setStatus("member");
      },
      elevate: async (pin) => {
        await api("/api/auth/commissioner", { body: { pin } });
        setStatus("commissioner");
      },
      logout: async () => {
        await api("/api/auth/logout", { method: "POST", body: {} });
        setStatus("anonymous");
      },
    }),
    [status, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

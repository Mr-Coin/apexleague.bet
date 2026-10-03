import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "anonymous" | "member" | "commissioner";

export interface AuthValue {
  status: AuthStatus;
  isCommissioner: boolean;
  login: (password: string) => Promise<void>;
  elevate: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

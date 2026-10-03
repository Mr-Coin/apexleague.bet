import type { Result } from "./types";

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export const kickoff = (s: string | number) =>
  new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";

export const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}`;

export const resultSymbol = (r: Result) =>
  r === "won" ? "✓" : r === "lost" ? "×" : r === "push" ? "=" : r === "void" ? "—" : "?";

/** Tailwind classes for a result pill / chip in the black & gold palette. */
export function resultTone(r: Result | string): string {
  switch (r) {
    case "won":
      return "bg-success/15 text-success border-success/30";
    case "lost":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "review":
      return "bg-accent/15 text-accent border-accent/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Left-accent border for a leg or week card. */
export function resultAccent(r: Result | string): string {
  switch (r) {
    case "won":
      return "border-l-success";
    case "lost":
      return "border-l-destructive";
    case "review":
      return "border-l-accent";
    default:
      return "border-l-transparent";
  }
}

export const resultChartColor: Record<string, string> = {
  won: "var(--success)",
  lost: "var(--destructive)",
  review: "var(--accent)",
  push: "var(--muted-foreground)",
  void: "var(--muted-foreground)",
  pending: "var(--muted-foreground)",
};

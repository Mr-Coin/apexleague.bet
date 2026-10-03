import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AllTime } from "./types";

export function AllTimeLosers({ allTime, busy }: { allTime: AllTime | null | undefined; busy: boolean }) {
  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Biggest losers · all time</CardTitle>
        <CardDescription className="text-muted-foreground">
          Most weekly low-score finishes. Ties count for everyone tied; this is not a record of actual payments.
        </CardDescription>
        {allTime && allTime.seasons.length > 0 && (
          <p className="text-xs text-muted-foreground">
            ESPN seasons: {allTime.seasons.join(", ")} · {allTime.weeks} completed weeks
          </p>
        )}
        {allTime && allTime.unavailable.length > 0 && (
          <p className="text-xs text-accent">Could not load {allTime.unavailable.join(", ")}. Totals are incomplete.</p>
        )}
      </CardHeader>
      <CardContent>
        <ol className="divide-y divide-border">
          {allTime?.leaders.map((p, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-muted text-muted-foreground text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-foreground break-words">{p.name}</strong>
                <small className="text-muted-foreground">
                  Lowest: {p.lowest.toFixed(2)} pts{p.ties ? " · " + p.ties + " tied finishes" : ""}
                </small>
              </div>
              <b className="text-right text-foreground tabular-nums shrink-0">
                {p.lowWeeks}
                <small className="block text-xs font-normal text-muted-foreground">low weeks</small>
              </b>
            </li>
          ))}
        </ol>
        {!allTime?.leaders.length && (
          <p className="text-sm text-muted-foreground">
            {busy ? "Loading league history…" : "No completed low-score records available yet."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

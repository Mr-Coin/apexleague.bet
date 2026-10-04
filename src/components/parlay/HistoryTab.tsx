import { ChevronRight, RefreshCw, Ticket } from "lucide-react";
import { parlayResult } from "#shared/parlay/model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AllTimeLosers } from "./AllTimeLosers";
import { Choice } from "./Choice";
import { resultAccent } from "./format";
import { LegCard } from "./LegCard";
import { PerformanceHistory } from "./PerformanceHistory";
import type { ClubhouseData, PickRow } from "./types";

interface HistoryTabProps {
  data: ClubhouseData | null;
  busy: boolean;
  season: string;
  week: string;
  currentSeason: number;
  onSeason: (season: string) => void;
  onWeek: (week: string) => void;
  onRefresh: () => void;
  isAdmin: boolean;
  teamName: (id: number) => string;
  onReview: (row: PickRow) => void;
}

const WEEK_OPTIONS = [
  { value: "current", label: "Current week" },
  ...Array.from({ length: 18 }, (_, i) => ({ value: String(i + 1), label: "Week " + (i + 1) })),
];

const outcomeTone = (label: string) => (label === "Won" ? "won" : label === "Lost" ? "lost" : "pending");

export function HistoryTab({
  data,
  busy,
  season,
  week,
  currentSeason,
  onSeason,
  onWeek,
  onRefresh,
  isAdmin,
  teamName,
  onReview,
}: HistoryTabProps) {
  const picks = data?.picks ?? [];
  const history = data?.history ?? [];
  const weeks = [...new Set(history.map((p) => p.week))];
  const seasons = data?.availableSeasons ?? [currentSeason];

  return (
    <div className="space-y-6">
      <PerformanceHistory performance={data?.performance} busy={busy} />
      <AllTimeLosers allTime={data?.allTime} busy={busy} />

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground">NO SHORT MEMORIES</p>
              <CardTitle className="text-foreground">The receipts</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground text-right">{season} season</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_2.75rem] gap-2 pt-2">
            <Choice
              label="Season"
              value={season}
              onChange={onSeason}
              options={seasons.map((y) => ({ value: String(y), label: String(y) }))}
            />
            <Choice label="Week" value={week} onChange={onWeek} options={WEEK_OPTIONS} />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              aria-label="Refresh history"
              onClick={onRefresh}
              disabled={busy}
            >
              <RefreshCw className={cn("w-4 h-4", busy && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {weeks.map((w) => {
              const ps = history.filter((p) => p.week === w);
              const outcome = parlayResult(ps);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onWeek(String(w))}
                  className={cn(
                    "relative text-left rounded-xl border border-border border-l-4 bg-card/60 p-4 hover:bg-card transition-colors flex flex-col gap-1",
                    resultAccent(outcomeTone(outcome)),
                  )}
                >
                  <span className="text-xs font-bold tracking-widest text-muted-foreground">WEEK {w}</span>
                  <strong
                    className={cn(
                      "text-lg",
                      outcome === "Won" ? "text-success" : outcome === "Lost" ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {outcome}
                  </strong>
                  <span className="text-sm text-muted-foreground">
                    {ps.filter((p) => p.result === "won").length} won · {ps.filter((p) => p.result === "lost").length}{" "}
                    lost · {ps.length} submitted
                  </span>
                  <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
          {!history.length && (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <Ticket className="w-7 h-7" />
              <h3 className="font-semibold text-foreground">A clean slate.</h3>
              <p className="text-sm">Saved weekly picks and their results will appear here.</p>
            </div>
          )}

          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Week {data?.week} · {data?.season} · {parlayResult(picks)}
            </h3>
            <p className="text-xs text-muted-foreground">
              Results reflect submitted picks. Sportsbook settlement may differ.
            </p>
            {picks.map((p) => (
              <LegCard
                key={p.id}
                row={p}
                teamName={teamName(p.team_id)}
                variant="receipt"
                canReview={isAdmin}
                onReview={onReview}
              />
            ))}
            {!picks.length && <p className="text-sm text-muted-foreground">No picks saved for this week.</p>}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

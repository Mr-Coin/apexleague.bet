import { Lock, Plus } from "lucide-react";
import { decimal, parlayResult } from "#shared/parlay/model";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { money, resultTone } from "./format";
import { LegCard } from "./LegCard";
import type { ClubhouseData, Game, PickRow } from "./types";

interface ParlaySlipProps {
  data: ClubhouseData | null;
  /** Non-Thursday games for the displayed week. */
  games: Game[];
  locked: boolean;
  busy: boolean;
  /** Reference time for kickoff comparisons (from the latest load / deadline tick). */
  now: number;
  isAdmin: boolean;
  /** The current viewer's own leg, if the chosen name already has one. */
  mine: PickRow | undefined;
  teamName: (id: number) => string;
  onMakePick: () => void;
  onEdit: (row: PickRow) => void;
  onDelete: (row: PickRow) => void;
  onReview: (row: PickRow) => void;
}

const STAKE = 25;

export function ParlaySlip({
  data,
  games,
  locked,
  busy,
  now,
  isAdmin,
  mine,
  teamName,
  onMakePick,
  onEdit,
  onDelete,
  onReview,
}: ParlaySlipProps) {
  const teams = data?.league.teams ?? [];
  const picks = data?.picks ?? [];
  const upcoming = games.some((g) => Date.parse(g.date) > now);
  const estimated = picks.reduce((v, p) => v * decimal(p.pick.odds), 1) * STAKE;
  const correlated = new Set(picks.map((p) => p.pick.eventId)).size < picks.length;
  const overall = locked ? parlayResult(picks) : "Building";
  const overallTone =
    overall === "Won" ? "won" : overall === "Lost" ? "lost" : overall === "Pending" ? "review" : "pending";
  const activeWeek = !!data && data.week === data.activeWeek;
  const canChange = (row: PickRow) =>
    !locked && activeWeek && row.result === "pending" && Date.parse(row.pick.kickoff) > now;
  const buttonDisabled =
    !data || locked || !activeWeek || !upcoming || (!!mine && Date.parse(mine.pick.kickoff) <= now);

  return (
    <Card className="bg-card border-border shadow-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {picks.length} / {teams.length || "—"} legs submitted
          </span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
              resultTone(overallTone),
            )}
          >
            {overall}
          </span>
        </div>
        <div className="px-5">
          <Progress value={teams.length ? (picks.length / teams.length) * 100 : 0} className="h-1.5" />
        </div>

        <div className="px-5 pt-5">
          <Button size="lg" className="w-full font-semibold shadow-glow" disabled={buttonDisabled} onClick={onMakePick}>
            <Plus className="w-4 h-4 mr-2" />
            {locked ? "Picks locked" : mine ? "Change my pick" : "Make my pick"}
          </Button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {picks.map((p) => (
            <LegCard
              key={p.id}
              row={p}
              teamName={teamName(p.team_id)}
              editable={canChange(p)}
              busy={busy}
              onEdit={onEdit}
              onDelete={onDelete}
              canReview={isAdmin}
              onReview={onReview}
            />
          ))}
          {!picks.length && <p className="text-center text-muted-foreground py-6">No picks yet.</p>}
        </div>

        {data && !locked && !upcoming && (
          <p className="text-xs text-muted-foreground text-center px-5 pb-2">
            {data.scheduleError
              ? "The schedule could not load. Tap refresh to retry."
              : "No games left to start. Next week opens Tuesday at 6 a.m. ET."}
          </p>
        )}

        <div className="mx-5 mt-2 pt-5 pb-4 border-t border-dashed border-border space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stake</span>
            <strong className="text-foreground tabular-nums">{money(STAKE)}</strong>
          </div>
          <div className="flex items-end justify-between gap-3">
            <span className="text-sm text-muted-foreground max-w-28">Estimated total return</span>
            <strong className="text-3xl font-extrabold tracking-tight text-primary tabular-nums break-all">
              {picks.length ? money(estimated) : "—"}
            </strong>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {correlated
              ? "Same-game legs detected. This estimate is unadjusted; DraftKings sets the actual combined price."
              : "Includes stake. Indicative only—not a DraftKings quote."}
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border-t border-border py-3">
          <Lock className="w-3 h-3" /> Locks Sunday, 1 p.m. ET. New week Tuesday.
        </p>
      </CardContent>
    </Card>
  );
}

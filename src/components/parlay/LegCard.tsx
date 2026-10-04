import { pickLabel, price } from "#shared/parlay/model";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resultAccent } from "./format";
import { OddsDetail } from "./OddsDetail";
import { ResultPill } from "./ResultPill";
import type { PickRow } from "./types";

interface LegCardProps {
  row: PickRow;
  teamName: string;
  /** Edit/Delete are offered only before kickoff on the active, unlocked week. */
  editable?: boolean;
  busy?: boolean;
  onEdit?: (row: PickRow) => void;
  onDelete?: (row: PickRow) => void;
  canReview?: boolean;
  onReview?: (row: PickRow) => void;
  /** History receipts show the odds estimate detail instead of the book/source meta line. */
  variant?: "slip" | "receipt";
}

export function LegCard({
  row,
  teamName,
  editable,
  busy,
  onEdit,
  onDelete,
  canReview,
  onReview,
  variant = "slip",
}: LegCardProps) {
  const p = row.pick;
  return (
    <div className={cn("rounded-xl border border-border border-l-4 bg-card/60 p-4", resultAccent(row.result))}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-muted-foreground min-w-0 break-words">{teamName}</span>
        <ResultPill result={row.result} />
      </div>
      <strong className="block text-foreground mt-1">{pickLabel(p)}</strong>
      {variant === "slip" ? (
        <>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mt-2">
            <span className="min-w-0 break-words">{p.game}</span>
            <b className="text-foreground tabular-nums">{price(p.odds)}</b>
          </div>
          <small className="block text-xs text-muted-foreground mt-1">
            {p.book} · {p.source === "manual" ? "Entered manually" : "Feed snapshot"}
          </small>
        </>
      ) : (
        <div className="mt-2 text-sm">
          <OddsDetail pick={p} />
        </div>
      )}
      {row.actual && <small className="block text-xs text-muted-foreground mt-1">{row.actual}</small>}
      {(editable || canReview) && (
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {editable && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(row)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Delete the pick for " + teamName + "?")) onDelete?.(row);
                }}
              >
                Delete
              </Button>
            </>
          )}
          {canReview && (
            <Button
              variant="link"
              size="sm"
              className="text-accent px-0 h-auto ml-auto"
              onClick={() => onReview?.(row)}
            >
              Review result
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

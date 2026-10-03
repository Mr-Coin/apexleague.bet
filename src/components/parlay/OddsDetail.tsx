import { price } from "#shared/parlay/model";
import type { SavedPick } from "./types";

/** Shows the saved price, or a labelled historical estimate when the ticket price is unknown. */
export function OddsDetail({ pick }: { pick: SavedPick }) {
  const e = pick.oddsEstimate;
  if (pick.odds !== null || !e) return <span className="tabular-nums text-foreground">{price(pick.odds)}</span>;
  return (
    <details className="text-sm max-w-full">
      <summary className="cursor-pointer min-h-8 py-1 font-semibold text-accent">≈ {price(e.odds)} · estimate</summary>
      <p className="text-muted-foreground my-2 leading-relaxed">{e.method}</p>
      <p className="text-muted-foreground my-2 leading-relaxed">
        Confidence: {e.confidence}. Original ticket price remains unknown.
      </p>
      <a href={e.url} target="_blank" rel="noreferrer" className="underline text-primary break-words">
        {e.source}
      </a>
    </details>
  );
}

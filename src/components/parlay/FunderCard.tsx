import { Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Funder } from "./types";

export function FunderCard({ funder }: { funder: Funder | null | undefined }) {
  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="hidden sm:grid place-items-center w-11 h-11 rounded-xl bg-primary/15 text-primary shrink-0">
          <Ticket className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-widest text-muted-foreground">THIS WEEK&apos;S $25 IS ON</p>
          <h3 className="text-lg font-semibold text-foreground break-words">
            {funder?.names || "Awaiting finalized scores"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {funder
              ? (funder.tie ? "Tied low score — commissioner resolves the funder." : "Last week’s lowest score") +
                " · " +
                funder.score.toFixed(2) +
                " pts"
              : "Automatically assigned from the previous completed APEX week."}
          </p>
        </div>
        <strong className="text-3xl font-extrabold tracking-tight text-primary shrink-0">$25</strong>
      </CardContent>
    </Card>
  );
}

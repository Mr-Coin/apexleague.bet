import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClubhouseData } from "./types";

function Connection({
  name,
  ok,
  okLabel,
  missingLabel,
}: {
  name: string;
  ok: boolean;
  okLabel: string;
  missingLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
      <span className="text-foreground">{name}</span>
      <b className={ok ? "text-success" : "text-accent"}>{ok ? okLabel : missingLabel}</b>
    </div>
  );
}

export function AdminTab({ data }: { data: ClubhouseData }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground">COMMISSIONER DESK</p>
        <h2 className="text-xl font-semibold text-foreground">Keep the league connected.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-panel-gradient border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Data connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <Connection
              name="APEX / ESPN"
              ok={data.connections.espn}
              okLabel="Configured"
              missingLabel="Needs credentials"
            />
            <p>
              Set the ESPN_S2 and ESPN_SWID secrets on the Worker (
              <code className="text-foreground">wrangler secret put</code>); never put them in a pick or member field.
            </p>
            <Connection
              name="The Odds API"
              ok={data.connections.odds}
              okLabel="Configured"
              missingLabel="Needs API key"
            />
            <p>
              Add ODDS_API_KEY as a Worker secret.{" "}
              <a
                href="https://the-odds-api.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-primary underline"
              >
                Get a free key <ArrowUpRight className="w-3 h-3" />
              </a>
            </p>
            <p>
              <strong className="text-foreground">{data.credits} / 450</strong> local monthly credits reserved.
              Available markets are shared and cached for 12 hours. Empty markets retry after five minutes. Other apps
              using the same key also consume its allowance.
            </p>
            <p className="rounded-md bg-accent/10 border border-accent/20 p-3 text-foreground/90">
              Results refresh when someone opens a week and every two minutes while the page is visible. Supported picks
              use saved ESPN player IDs and numeric rules—no AI. Missing stats stay pending for retry; injury voids and
              unsupported bets require review.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-panel-gradient border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">League access</CardTitle>
            <CardDescription className="text-muted-foreground">Who can add a leg</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Anyone signed in with the league password can view the parlay and choose their name to add a pick. Use
              Edit or Delete on a leg before picks lock.
            </p>
            <p>Names come from ESPN league owners. No invitations or account assignments are needed.</p>
            <p>
              Commissioner tools (this tab and “Review result”) unlock with the PIN in the header settings menu and
              expire after 12 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

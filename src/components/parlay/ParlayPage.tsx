import { AlertCircle, ArrowUpRight, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { isThursday } from "#shared/parlay/week";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AdminTab } from "./AdminTab";
import { FunderCard } from "./FunderCard";
import { HistoryTab } from "./HistoryTab";
import { ParlaySlip } from "./ParlaySlip";
import { PickDialog } from "./PickDialog";
import { ReviewDialog } from "./ReviewDialog";
import type { PickInput, PickRow, Result } from "./types";
import { currentSeason, useParlay, type ParlayTab } from "./use-parlay";

export default function ParlayPage() {
  const { isCommissioner } = useAuth();
  const { data, error, busy, loadedAt, tab, setTab, season, setSeason, week, setWeek, load, act, context } =
    useParlay();

  // Re-render once the Sunday deadline passes so the slip locks without a reload.
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (!data?.deadline) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, data.deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [data?.deadline]);
  const now = Math.max(clock, loadedAt);
  const locked = !!data?.locked || now >= (data?.deadline ?? Infinity);

  // Dialog state. Each open remounts PickDialog via `dialogKey` so its form starts fresh.
  const [pickOpen, setPickOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editing, setEditing] = useState<PickRow | null>(null);
  const [pickTeam, setPickTeam] = useState("");
  const [reviewRow, setReviewRow] = useState<PickRow | null>(null);

  const isAdmin = isCommissioner || !!data?.user.admin;
  const teams = data?.league.teams ?? [];
  const picks = data?.picks ?? [];
  const games = (data?.games ?? []).filter((g) => !isThursday(g.date));

  const teamName = (id: number) =>
    teams.find((t) => t.id === id)?.personName ||
    teams.find((t) => t.id === id)?.name ||
    data?.members.find((m) => m.team_id === id)?.name ||
    "Team " + id;

  const mine = picks.find(
    (p) => String(p.team_id) === pickTeam || teamName(p.team_id).toLowerCase() === pickTeam.trim().toLowerCase(),
  );

  const openPick = (row: PickRow | null) => {
    setEditing(row);
    if (row) setPickTeam(String(row.team_id));
    setDialogKey((k) => k + 1);
    setPickOpen(true);
  };

  const savePick = async (team: string, pick: PickInput) => {
    setPickTeam(team);
    return act({ action: "pick", team, pick });
  };

  const deletePick = (row: PickRow) => void act({ action: "deletePick", team: String(row.team_id) });

  const saveReview = (id: string, result: Result, reason: string) => act({ action: "grade", id, result, reason });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground">THE WEEKLY PARLAY</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Week {data?.week ?? "—"}</h1>
          <p className="text-sm text-muted-foreground mt-1">$25 group parlay · Locks Sunday, 1 p.m. ET</p>
        </div>
        <Button variant="outline" size="icon" aria-label="Refresh parlay" onClick={() => void load()} disabled={busy}>
          <RefreshCw className={cn("w-4 h-4", busy && "animate-spin")} />
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (!data.connections.espn || !data.connections.odds) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <strong className="text-foreground mr-1.5">Parlay setup</strong>
            <span className="text-muted-foreground">
              {!data.connections.espn ? " ESPN connection needed." : ""}
              {!data.connections.odds ? " Odds key needed; manual entry is supported." : ""}
            </span>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTab("settings")}>
              View setup <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as ParlayTab)}>
        <TabsList className={cn("grid w-full h-auto", isAdmin ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="week" className="py-2.5">
            This week
          </TabsTrigger>
          <TabsTrigger value="history" className="py-2.5">
            History
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="py-2.5">
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="week" className="mt-6 space-y-4">
          <FunderCard funder={data?.funder} />
          <ParlaySlip
            data={data}
            games={games}
            locked={locked}
            busy={busy}
            now={now}
            isAdmin={isAdmin}
            mine={mine}
            teamName={teamName}
            onMakePick={() => openPick(mine ?? null)}
            onEdit={openPick}
            onDelete={deletePick}
            onReview={setReviewRow}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab
            data={data}
            busy={busy}
            season={season}
            week={week}
            currentSeason={currentSeason()}
            onSeason={setSeason}
            onWeek={setWeek}
            onRefresh={() => void load()}
            isAdmin={isAdmin}
            teamName={teamName}
            onReview={setReviewRow}
          />
        </TabsContent>

        {isAdmin && data && (
          <TabsContent value="settings" className="mt-6">
            <AdminTab data={data} />
          </TabsContent>
        )}
      </Tabs>

      <p className="text-xs text-muted-foreground text-center pt-2">
        $25. One leg each. All season long. · Odds are estimates · Final payouts come from the sportsbook.
      </p>

      {data && (
        <PickDialog
          key={dialogKey}
          open={pickOpen}
          onOpenChange={setPickOpen}
          data={data}
          context={context}
          games={games}
          teamName={teamName}
          editing={editing}
          initialTeam={pickTeam}
          locked={locked}
          busy={busy}
          now={now}
          onSave={savePick}
        />
      )}

      <ReviewDialog
        key={reviewRow?.id ?? "none"}
        row={reviewRow}
        onClose={() => setReviewRow(null)}
        busy={busy}
        onSave={saveReview}
      />
    </div>
  );
}

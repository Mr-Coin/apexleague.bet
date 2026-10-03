import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { markets, price } from "#shared/parlay/model";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Choice } from "./Choice";
import { kickoff } from "./format";
import { useOdds } from "./use-odds";
import type { ClubhouseData, Game, OddsOption, PickInput, PickRow, WeekContext } from "./types";

const NO_LINE = ["h2h", "player_anytime_td", "custom"];
const TEAM_SIDED = ["h2h", "spreads"];

interface PickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ClubhouseData;
  context: WeekContext;
  /** Upcoming, non-Thursday games for this week. */
  games: Game[];
  teamName: (id: number) => string;
  /** When editing, the existing row prefills the manual form. */
  editing: PickRow | null;
  /** Team id the viewer chose last time, carried between opens. */
  initialTeam: string;
  locked: boolean;
  busy: boolean;
  /** Reference time for filtering to upcoming games. */
  now: number;
  onSave: (team: string, pick: PickInput) => Promise<boolean>;
}

/**
 * "Make your pick" form. The parent remounts this component (via `key`) each
 * time it opens so the form state below starts fresh or prefilled from `editing`.
 */
export function PickDialog({
  open,
  onOpenChange,
  data,
  context,
  games,
  teamName,
  editing,
  initialTeam,
  locked,
  busy,
  now,
  onSave,
}: PickDialogProps) {
  const e = editing?.pick;
  const [pickTeam, setPickTeam] = useState(editing ? String(editing.team_id) : initialTeam);
  const [manual, setManual] = useState(!!editing);
  const [eventId, setEvent] = useState(e?.eventId ?? "");
  const [market, setMarket] = useState(e?.market ?? "h2h");
  const [player, setPlayer] = useState(e?.player ?? "");
  const [side, setSide] = useState(e?.side ?? "Over");
  const [line, setLine] = useState(e?.line === null || e?.line === undefined ? "" : String(e.line));
  const [odds, setOdds] = useState(e ? String(e.odds) : "-110");
  const [book, setBook] = useState(e?.book ?? "DraftKings");
  const [note, setNote] = useState(e?.note ?? "");
  const [selected, setSelected] = useState<OddsOption | null>(null);
  const [search, setSearch] = useState("");

  const teams = data.league.teams;
  const upcoming = games.filter((g) => Date.parse(g.date) > now);
  const selectedGame = games.find((g) => g.id === eventId);

  const { oddsData, oddsError, loadingOdds, retryOdds } = useOdds({
    enabled: open && !manual && data.connections.odds,
    context,
    eventId,
    market,
  });

  const playerSearch = market.startsWith("player_") && !!oddsData?.options.length;
  const query = search
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  const filteredOdds = (oddsData?.options ?? []).filter(
    (o) =>
      !playerSearch ||
      query.split(/\s+/).every((word) =>
        (o.player ?? "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .includes(word),
      ),
  );

  const changeGame = (v: string) => {
    setEvent(v);
    setSearch("");
    setSelected(null);
  };

  const changeMarket = (v: string) => {
    setMarket(v);
    setSearch("");
    setSelected(null);
    setSide(TEAM_SIDED.includes(v) ? (selectedGame?.home ?? "") : v === "player_anytime_td" ? "Yes" : "Over");
  };

  const sideOptions =
    market === "h2h" || market === "spreads"
      ? [selectedGame?.home, selectedGame?.away].filter((v): v is string => !!v)
      : market === "player_anytime_td"
        ? ["Yes"]
        : ["Over", "Under"];

  const save = async () => {
    const p: PickInput | null = manual
      ? {
          eventId,
          market,
          player,
          side: market === "player_anytime_td" ? "Yes" : side,
          line: NO_LINE.includes(market) ? null : line.trim() ? Number(line) : null,
          odds: Number(odds),
          book,
          source: "manual",
          sourceTime: Date.now(),
          note,
        }
      : selected
        ? {
            eventId,
            market,
            player: selected.player ?? "",
            side: selected.side,
            line: selected.line ?? null,
            odds: selected.odds,
            book: selected.book ?? oddsData?.book ?? "DraftKings",
            source: "feed",
            sourceTime: selected.sourceTime ?? oddsData?.updated ?? Date.now(),
          }
        : null;
    if (!p) {
      toast.error("Choose a selection first.");
      return;
    }
    if (await onSave(pickTeam, p)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90dvh] overflow-auto bg-card border-border w-[calc(100%-1.5rem)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Make your pick</DialogTitle>
          <DialogDescription>Choose a game, then a category. No Thursday games.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Your name">
            <Choice
              label="Choose your name"
              value={pickTeam}
              onChange={setPickTeam}
              options={[...teams]
                .sort((a, b) => teamName(a.id).localeCompare(teamName(b.id)))
                .map((t) => ({ value: String(t.id), label: teamName(t.id) }))}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            One pick per person. Saving replaces your previous unstarted pick.
          </p>

          <Tabs
            value={manual ? "manual" : "feed"}
            onValueChange={(v) => {
              setManual(v === "manual");
              setSelected(null);
            }}
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="feed">Browse odds</TabsTrigger>
              <TabsTrigger value="manual">Enter manually</TabsTrigger>
            </TabsList>
          </Tabs>

          {!upcoming.length && (
            <Note>No upcoming games are available for this week. The next week opens Tuesday at 6 a.m. ET.</Note>
          )}

          <Field label="Game">
            <Choice
              label="Select a game"
              value={eventId}
              onChange={changeGame}
              options={upcoming.map((g) => ({ value: g.id, label: g.name + " · " + kickoff(g.date) }))}
            />
          </Field>
          <Field label="Category">
            <Choice
              label="Market"
              value={market}
              onChange={changeMarket}
              options={Object.entries(markets)
                .filter(([k]) => manual || k !== "custom")
                .map(([value, label]) => ({ value, label }))}
            />
          </Field>

          {!manual ? (
            <div className="space-y-3">
              {loadingOdds && (
                <p className="text-xs text-muted-foreground" role="status">
                  Loading odds…
                </p>
              )}
              {!data.connections.odds && (
                <Note>The free odds key has not been connected. You can still enter a pick manually.</Note>
              )}
              {oddsError && (
                <Note role="alert">
                  {oddsError}{" "}
                  <button type="button" className="underline text-primary" onClick={retryOdds}>
                    Retry
                  </button>
                </Note>
              )}
              {oddsData && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {oddsData.book || "No bookmaker coverage"} · Snapshot {kickoff(oddsData.updated)}
                  </p>
                  {playerSearch && (
                    <div className="space-y-2">
                      <Label htmlFor="player-filter" className="text-foreground">
                        Filter players in this market
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="player-filter"
                          type="search"
                          placeholder="Type a player’s name…"
                          value={search}
                          onChange={(ev) => setSearch(ev.target.value)}
                          className="bg-muted/40"
                        />
                        {search && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setSearch("")}>
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                        {filteredOdds.length} of {oddsData.options.length} selections · {markets[market]} ·{" "}
                        {selectedGame?.name}
                      </p>
                    </div>
                  )}
                  <div className="max-h-60 overflow-auto flex flex-col gap-2 pr-1">
                    {filteredOdds.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelected(o)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          selected === o
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:bg-muted/60",
                        )}
                      >
                        <span className="flex-1 min-w-0">
                          <strong className="block text-sm text-foreground break-words">{o.player || o.side}</strong>
                          <small className="block text-xs text-muted-foreground">
                            {o.player ? o.side : ""} {o.line ?? ""}
                          </small>
                        </span>
                        <b className="tabular-nums text-foreground">{price(o.odds)}</b>
                        {selected === o && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                    {!oddsData.options.length && (
                      <p className="text-sm text-muted-foreground">
                        {oddsData.message || "This market is not posted yet. Try later or enter manually."}
                      </p>
                    )}
                    {oddsData.options.length > 0 && !filteredOdds.length && (
                      <p className="text-sm text-muted-foreground">
                        No players match “{search}” in this game and category. Clear the filter or choose another
                        category.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(market.startsWith("player_") || market === "custom") && (
                  <Field label="Player / selection">
                    <Input
                      value={player}
                      onChange={(ev) => setPlayer(ev.target.value)}
                      placeholder="Full player name"
                    />
                  </Field>
                )}
                <Field label="Selection">
                  {market === "custom" ? (
                    <Input value={side} onChange={(ev) => setSide(ev.target.value)} placeholder="Describe the bet" />
                  ) : (
                    <Choice
                      label="Selection"
                      value={side}
                      onChange={setSide}
                      options={sideOptions.map((v) => ({ value: v, label: v }))}
                    />
                  )}
                </Field>
                {!NO_LINE.includes(market) && (
                  <Field label="Line">
                    <Input
                      type="number"
                      step="any"
                      value={line}
                      onChange={(ev) => setLine(ev.target.value)}
                      placeholder="e.g. 4.5"
                    />
                  </Field>
                )}
                <Field label="American odds">
                  <Input
                    type="number"
                    value={odds}
                    onChange={(ev) => setOdds(ev.target.value)}
                    placeholder="-110 or +150"
                  />
                </Field>
                <Field label="Sportsbook">
                  <Input value={book} onChange={(ev) => setBook(ev.target.value)} />
                </Field>
              </div>
              <Field label="Note (optional)">
                <Input
                  value={note}
                  onChange={(ev) => setNote(ev.target.value)}
                  maxLength={300}
                  placeholder="Any detail the funder needs"
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Supported picks are verified against ESPN when saved and graded automatically from final results. Other
                bets require review.
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full font-semibold"
            disabled={busy || locked || !pickTeam.trim() || !eventId || (!manual && !selected)}
            onClick={() => void save()}
          >
            Save my leg <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground min-w-0">
      {label}
      {children}
    </label>
  );
}

function Note({ children, role }: { children: React.ReactNode; role?: string }) {
  return (
    <div
      role={role}
      className="text-sm rounded-md bg-accent/10 border border-accent/20 text-accent-foreground/90 text-foreground p-3"
    >
      {children}
    </div>
  );
}

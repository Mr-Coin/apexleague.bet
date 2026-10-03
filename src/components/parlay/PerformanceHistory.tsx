import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pickLabel } from "#shared/parlay/model";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resultChartColor, resultSymbol, resultTone, signed } from "./format";
import type { Performance, PerformanceRecord, Result, TimelinePoint } from "./types";

type ChartPoint = TimelinePoint & { value: number | null };

const stripYear = (label: string) => label.replace(/^\d{4} /, "");

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}

function ResultDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload || payload.value === null) return <g />;
  const color = resultChartColor[payload.result] ?? resultChartColor.pending;
  return (
    <g>
      <title>
        {payload.label}: {payload.result}
      </title>
      <circle cx={cx} cy={cy} r={10} fill={color} stroke="var(--card)" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--card)" fontSize={13} fontWeight={800}>
        {resultSymbol(payload.result)}
      </text>
    </g>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}

function ChartTooltip({ active, payload }: TooltipProps) {
  const p = payload?.[0]?.payload;
  if (!active || !p || p.value === null) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-2.5 text-sm shadow-card grid gap-1">
      <b className="text-foreground">
        {p.label} · {p.result}
      </b>
      <span className="text-muted-foreground">
        {signed(p.value)}u total{p.estimated ? " · estimated odds" : ""}
      </span>
      <span className="text-muted-foreground">{pickLabel(p.pick)}</span>
    </div>
  );
}

function Metric({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-bold text-foreground tabular-nums mt-0.5", className)}>{children}</dd>
    </div>
  );
}

function streakLabel(record: PerformanceRecord): string {
  if (!record.streak || !record.streakResult) return "Awaiting result";
  const win = record.streakResult === "won";
  return `${record.streak} ${win ? (record.streak === 1 ? "win" : "wins") : record.streak === 1 ? "loss" : "losses"}`;
}

function MemberCard({ record }: { record: PerformanceRecord }) {
  const data: ChartPoint[] = record.timeline.map((p) => ({ ...p, value: p.units }));
  const state: Result = record.streakResult ?? "pending";
  const unitsTone = record.units >= 0 ? "text-success" : "text-destructive";

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 bg-card",
        state === "won" ? "border-success/30" : state === "lost" ? "border-destructive/30" : "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground leading-snug break-words">{record.name}</h3>
        <span className={cn("rounded-md border px-2 py-0.5 text-xs font-bold whitespace-nowrap", resultTone(state))}>
          {streakLabel(record)}
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-x-2 gap-y-3 my-4">
        <Metric label="Record">
          <span className="text-success">{record.wins} W</span> ·{" "}
          <span className="text-destructive">{record.losses} L</span>
        </Metric>
        <Metric label="Win rate">{record.winRate === null ? "—" : record.winRate.toFixed(0) + "%"}</Metric>
        <Metric label="Net units" className={unitsTone}>
          {record.priced ? signed(record.units) + "u" : "—"}
        </Metric>
        <Metric label="ROI">{record.roi === null ? "—" : signed(record.roi) + "%"}</Metric>
        <Metric label="Avg odds">
          {record.averageDecimal === null ? "—" : record.averageDecimal.toFixed(2) + "×"}
        </Metric>
        <Metric label="Avg net / pick">{record.averageUnits === null ? "—" : signed(record.averageUnits) + "u"}</Metric>
      </dl>

      <div className="flex justify-between text-xs font-semibold text-foreground">
        Net units <span className="font-normal text-muted-foreground">1u per pick</span>
      </div>
      <div className="h-32 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 18, bottom: 2, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={stripYear}
              minTickGap={16}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={34}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              allowDecimals
              tickFormatter={(n: number) => n.toFixed(1)}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              connectNulls={false}
              dot={<ResultDot />}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className="grid gap-1.5 my-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2.5rem, 1fr))" }}
        aria-label={`${record.name} weekly results`}
      >
        {record.timeline.map((p) => (
          <span
            key={p.label}
            tabIndex={0}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border min-h-11 p-1 text-[11px] leading-tight",
              resultTone(p.result),
            )}
            title={`${p.label}: ${p.result} · ${pickLabel(p.pick)}${p.delta === null ? "" : ` · ${signed(p.delta)}u`}${p.estimated ? " · estimated odds" : ""}`}
            aria-label={`${p.label}: ${p.result}, ${pickLabel(p.pick)}`}
          >
            <b className="text-base leading-none">{resultSymbol(p.result)}</b>
            <span>
              {stripYear(p.label)}
              {p.estimated ? " ≈" : ""}
            </span>
          </span>
        ))}
      </div>

      <div className="flex justify-between flex-wrap gap-2 text-sm mt-2">
        <span className="text-success">Best: {record.longestWin} W</span>
        <span className="text-destructive">Skid: {record.longestLoss} L</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        {record.priced} priced results{record.estimated ? ` · ${record.estimated} estimated` : ""}
        {record.missingOdds ? ` · ${record.missingOdds} missing prices` : ""}
        {record.pending ? ` · ${record.pending} pending / review` : ""}
        {record.pushes ? ` · ${record.pushes} pushes` : ""}
        {record.voids ? ` · ${record.voids} voids` : ""}
      </p>
    </article>
  );
}

export function PerformanceHistory({
  performance,
  busy,
}: {
  performance: Performance | null | undefined;
  busy: boolean;
}) {
  const leaders = performance?.estimatedLeaders ?? performance?.leaders ?? [];
  const sorted = [...leaders].sort(
    (a, b) => (b.units ?? -Infinity) - (a.units ?? -Infinity) || a.name.localeCompare(b.name),
  );

  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Individual picks · all time</CardTitle>
        <p className="text-xs text-muted-foreground">
          1u straight bets · ≈ historical price estimates included · ordered by net units
        </p>
        <div className="flex gap-4 flex-wrap text-sm">
          <span className="text-success">✓ Win</span>
          <span className="text-destructive">× Loss</span>
          <span className="text-muted-foreground">? Pending / review</span>
        </div>
        {performance && performance.unavailable.length > 0 && (
          <p className="text-xs text-accent">
            Some season identities are unavailable; unmatched records stay separate.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((p) => (
            <MemberCard key={p.key} record={p} />
          ))}
        </div>
        {!leaders.length && (
          <p className="text-sm text-muted-foreground">{busy ? "Loading betting records…" : "No saved picks yet."}</p>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Win rate = W ÷ (W + L). Average odds use decimal payouts; average net uses priced W/L picks. Pending, push and
          void do not change returns. Missing prices leave gaps. Returns are hypothetical individual bets, not parlay
          winnings.
        </p>
      </CardContent>
    </Card>
  );
}

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AllTime } from "./types";

export function WeeklyLowHistogram({ allTime, busy }: { allTime?: AllTime | null; busy: boolean }) {
  const records = allTime?.weeklyLows ?? [];
  const current = allTime?.currentLow;
  const low = records.length ? Math.min(...records.map((r) => r.score)) : null;
  const recordHolders = records.filter((r) => r.score === low);
  const width = 10;
  const values = [...records.map((r) => r.score), ...(current ? [current.score] : [])];
  const start = Math.floor(Math.min(0, ...values) / width) * width;
  const end = Math.floor(Math.max(10, ...values) / width) * width + width;
  const bins = Array.from({ length: (end - start) / width }, (_, i) => {
    const from = start + i * width;
    return {
      midpoint: from + width / 2,
      range: `${from}–<${from + width}`,
      count: records.filter((r) => r.score >= from && r.score < from + width).length,
    };
  });
  const below = current ? records.filter((r) => r.score < current.score).length : 0;
  const missing = allTime?.histogramUnavailable ?? [];
  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <p className="text-xs font-bold tracking-widest text-muted-foreground">HOW LOW CAN YOU GO?</p>
        <CardTitle>Weekly lowest scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!records.length ? (
          <p className="text-sm text-muted-foreground">
            {busy ? "Loading league history…" : "Verified regular-season history is not available yet."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {missing.length ? "Lowest in available history" : "All-time regular-season low"}
                </p>
                <strong className="text-2xl text-destructive">{low?.toFixed(2)}</strong>
                {recordHolders.map((r) => (
                  <p className="text-xs" key={`${r.season}-${r.week}`}>
                    {r.people.map((p) => p.name).join(" / ")} · {r.season} Week {r.week}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This week · live, not final</p>
                <strong className="text-2xl text-primary">{current ? current.score.toFixed(2) : "—"}</strong>
                <p className="text-xs">
                  {current
                    ? `${current.people.map((p) => p.name).join(" / ")} · ${current.season} Week ${current.week}`
                    : "Waiting for a current regular-season score."}
                </p>
                {current && (
                  <p className="text-xs text-muted-foreground">
                    {below} of {records.length} historical weekly lows were lower. Scores can still change.
                  </p>
                )}
              </div>
            </div>
            <div
              className="h-56"
              role="img"
              aria-label={`Histogram of ${records.length} completed weekly lowest scores in 10-point bins. Record: ${low?.toFixed(2)}.${current ? ` Current provisional low: ${current.score.toFixed(2)}.` : ""}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bins} margin={{ top: 24, right: 20, bottom: 16, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis
                    type="number"
                    dataKey="midpoint"
                    domain={[start, end]}
                    tick={{ fontSize: 11 }}
                    label={{ value: "Fantasy points", position: "insideBottom", offset: -12 }}
                  />
                  <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(_, payload) => payload[0]?.payload?.range + " points"}
                    formatter={(value) => [value, "Weeks"]}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                  <ReferenceLine
                    x={low!}
                    stroke="var(--color-destructive)"
                    strokeWidth={2}
                    label={{ value: "Record", position: "insideTopLeft", fontSize: 11 }}
                  />
                  {current && (
                    <ReferenceLine
                      x={current.score}
                      stroke="var(--color-foreground)"
                      strokeDasharray="4 3"
                      label={{ value: "Live", position: "top", fontSize: 11 }}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              {records.length} completed weeks · {[...new Set(records.map((r) => r.season))].sort().join(", ")} · One
              low per week, ties counted once. Playoffs excluded. Live scores do not enter the histogram.
            </p>
          </>
        )}
        {!!missing.length && (
          <p className="text-xs text-amber-500">
            Incomplete coverage: {missing.join(", ")} unavailable or missing a verified regular-season cutoff. The
            record may not cover the full league history.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import type { Pick } from "#shared/parlay/model";
import type { SettlementRule } from "#shared/parlay/settlement-rule";
import type { EspnSummary } from "./types";

export const statRules: Record<string, { group: string; key: string; label: string }> = {
  player_pass_yds: { group: "passing", key: "passingYards", label: "YDS" },
  player_pass_tds: { group: "passing", key: "passingTouchdowns", label: "TD" },
  player_rush_yds: { group: "rushing", key: "rushingYards", label: "YDS" },
  player_reception_yds: { group: "receiving", key: "receivingYards", label: "YDS" },
  player_receptions: { group: "receiving", key: "receptions", label: "REC" },
};

export type { SettlementRule };

export function makeRule(p: Pick, athleteId?: string): SettlementRule {
  return {
    version: 1,
    provider: "espn",
    eventId: p.eventId,
    athleteId,
    market: p.market,
    side: p.side,
    line: p.line,
    statKey: statRules[p.market]?.key || (p.market === "player_anytime_td" ? "scoringTouchdowns" : "gameScore"),
  };
}

export function readPlayerStat(data: EspnSummary, p: Pick): number | undefined {
  if (!data.header?.competitions?.[0]?.status?.type?.completed) return;
  if (String(data.header?.id) !== p.eventId) return;
  const id = p.settlement?.athleteId;
  if (!id) return;
  const rule = statRules[p.market];
  let total = 0,
    found = false;
  for (const team of data.boxscore?.players || [])
    for (const group of team.statistics || []) {
      if (rule && group.name !== rule.group) continue;
      if (
        !rule &&
        !(
          p.market === "player_anytime_td" &&
          ["rushing", "receiving", "kickReturns", "puntReturns"].includes(group.name ?? "")
        )
      )
        continue;
      const rows = (group.athletes || []).filter((a) => String(a.athlete?.id) === id);
      if (rows.length !== 1) continue;
      const keys = rule
        ? [rule.key]
        : ["rushingTouchdowns", "receivingTouchdowns", "touchdowns", "kickReturnTouchdowns", "puntReturnTouchdowns"];
      let index = (group.keys || group.names || []).findIndex((k) => keys.includes(k));
      if (index < 0) index = (group.labels || []).indexOf(rule?.label || "TD");
      if (index < 0) continue;
      const raw = rows[0].stats?.[index];
      if (typeof raw !== "string" && typeof raw !== "number") continue;
      if (String(raw).trim() === "" || !Number.isFinite(Number(raw))) continue;
      found = true;
      total += Number(raw);
    }
  // A zero TD box-score row cannot prove absence of a return/recovery TD.
  if (!found || (p.market === "player_anytime_td" && total === 0 && !verifiedZeroTouchdowns(data, id))) return;
  return total;
}

// Prove a zero only when every TD in the complete scoring log is a normal
// rushing/receiving score and both teams' player TD totals reconcile with it.
// Return/recovery/defensive TDs and incomplete feeds remain pending.
function verifiedZeroTouchdowns(data: EspnSummary, athleteId: string): boolean {
  const competitors = data.header?.competitions?.[0]?.competitors || [];
  const teams = data.boxscore?.players || [],
    plays = data.scoringPlays;
  if (competitors.length !== 2 || teams.length !== 2 || !Array.isArray(plays)) return false;
  const last = plays.at(-1);
  for (const c of competitors) {
    const score = Number(c.score),
      key = c.homeAway === "home" ? "homeScore" : c.homeAway === "away" ? "awayScore" : null;
    if (!key || !Number.isFinite(score) || score < 0 || Number(last?.[key] ?? 0) !== score) return false;
  }
  if (
    plays.some(
      (p) =>
        !["field-goal", "touchdown", "extra-point", "two-point-conversion", "safety"].includes(
          p.scoringType?.name ?? "",
        ),
    )
  )
    return false;
  // Check score progression too: a missing scoring play must not hide a TD.
  let home = 0,
    away = 0;
  for (const play of plays) {
    const scorer = competitors.find((c) => String(c.id) === String(play.team?.id));
    if (!scorer) return false;
    const h = Number(play.homeScore),
      a = Number(play.awayScore),
      homeTeam = scorer.homeAway === "home";
    const delta = homeTeam ? h - home : a - away;
    const allowed: Record<string, number[]> = {
      touchdown: [6, 7, 8],
      "field-goal": [3],
      "extra-point": [1],
      "two-point-conversion": [2],
      safety: [2],
    };
    if (!allowed[play.scoringType?.name ?? ""]?.includes(delta) || (homeTeam ? a !== away : h !== home)) return false;
    home = h;
    away = a;
  }
  const touchdowns = plays.filter((p) => p.scoringType?.name === "touchdown");
  if (
    touchdowns.some(
      (p) =>
        !["67", "68"].includes(String(p.type?.id)) || !competitors.some((c) => String(c.id) === String(p.team?.id)),
    )
  )
    return false;
  let participated = false;
  for (const c of competitors) {
    const matches = teams.filter((t) => String(t.team?.id) === String(c.id));
    if (matches.length !== 1) return false;
    let total = 0;
    for (const [name, tdKey, activityKeys] of [
      ["rushing", "rushingTouchdowns", ["rushingAttempts"]],
      ["receiving", "receivingTouchdowns", ["receptions", "receivingTargets"]],
    ] as const) {
      const groups = (matches[0].statistics || []).filter((g) => g.name === name);
      if (groups.length !== 1) return false;
      const g = groups[0],
        keys = g.keys || g.names || [],
        index = keys.indexOf(tdKey);
      if (index < 0 || !Array.isArray(g.athletes)) return false;
      const seen = new Set<string>();
      for (const row of g.athletes) {
        const id = String(row.athlete?.id || ""),
          raw = row.stats?.[index];
        if (
          !id ||
          seen.has(id) ||
          raw === null ||
          raw === undefined ||
          String(raw).trim() === "" ||
          !Number.isInteger(Number(raw)) ||
          Number(raw) < 0
        )
          return false;
        seen.add(id);
        total += Number(raw);
        if (id === athleteId && activityKeys.some((k) => Number(row.stats?.[keys.indexOf(k)]) > 0)) participated = true;
      }
    }
    if (total !== touchdowns.filter((p) => String(p.team?.id) === String(c.id)).length) return false;
  }
  return participated;
}

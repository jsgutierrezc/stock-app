import "server-only";
import { db } from "./supabase";
import { calculatePoints, isMatchScored } from "./scoring";
import type { ScoringRules } from "./types";

export async function recalcAllPoints(): Promise<{ updated: number }> {
  const supa = db();
  const { data: rules } = await supa.from("scoring_rules").select("*").eq("id", 1).single();
  const { data: matches } = await supa.from("matches").select("*");
  const { data: preds } = await supa.from("predictions").select("*");
  if (!rules || !matches || !preds) return { updated: 0 };

  const matchById = new Map<number, (typeof matches)[number]>(
    matches.map((m) => [m.id, m])
  );
  let updated = 0;
  const updates: { id: string; points: number }[] = [];
  for (const p of preds) {
    const m = matchById.get(p.match_id);
    let pts = 0;
    if (m && isMatchScored(m)) {
      pts = calculatePoints(
        { home: p.home_score, away: p.away_score },
        { home: m.home_score!, away: m.away_score! },
        rules as ScoringRules,
        m.stage
      );
    }
    if (pts !== p.points) {
      updates.push({ id: p.id, points: pts });
      updated++;
    }
  }

  // upsert por lotes
  for (let i = 0; i < updates.length; i += 200) {
    const slice = updates.slice(i, i + 200);
    await supa.from("predictions").upsert(slice, { onConflict: "id" });
  }

  return { updated };
}

export async function recalcPointsForMatch(matchId: number): Promise<void> {
  const supa = db();
  const [{ data: match }, { data: rules }, { data: preds }] = await Promise.all([
    supa.from("matches").select("*").eq("id", matchId).single(),
    supa.from("scoring_rules").select("*").eq("id", 1).single(),
    supa.from("predictions").select("*").eq("match_id", matchId),
  ]);
  if (!match || !rules || !preds) return;

  const updates: { id: string; points: number }[] = [];
  for (const p of preds) {
    const pts = isMatchScored(match)
      ? calculatePoints(
          { home: p.home_score, away: p.away_score },
          { home: match.home_score!, away: match.away_score! },
          rules as ScoringRules,
          match.stage
        )
      : 0;
    if (pts !== p.points) updates.push({ id: p.id, points: pts });
  }
  if (updates.length > 0) {
    await supa.from("predictions").upsert(updates, { onConflict: "id" });
  }
}

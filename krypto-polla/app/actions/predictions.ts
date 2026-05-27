"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { isKickoffLocked } from "@/lib/utils";

export interface SaveResult {
  ok: boolean;
  saved: number;
  locked: number;
  error?: string;
}

export async function savePredictions(formData: FormData): Promise<SaveResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, saved: 0, locked: 0, error: "Sesión expirada" };
  }

  const supa = db();
  const ids = new Set<number>();
  for (const k of formData.keys()) {
    const m = k.match(/^h_(\d+)$/);
    if (m) ids.add(Number(m[1]));
  }
  if (ids.size === 0) return { ok: true, saved: 0, locked: 0 };

  const { data: matches, error: mErr } = await supa
    .from("matches")
    .select("id, kickoff_at")
    .in("id", Array.from(ids));
  if (mErr) return { ok: false, saved: 0, locked: 0, error: mErr.message };

  const lockedSet = new Set<number>();
  const kickoffById = new Map<number, string>();
  for (const m of matches ?? []) {
    kickoffById.set(m.id, m.kickoff_at);
    if (isKickoffLocked(m.kickoff_at)) lockedSet.add(m.id);
  }

  type Row = {
    participant_id: string;
    match_id: number;
    home_score: number;
    away_score: number;
  };
  const rows: Row[] = [];
  for (const id of ids) {
    if (lockedSet.has(id)) continue;
    const hs = formData.get(`h_${id}`);
    const as = formData.get(`a_${id}`);
    if (hs === "" || hs === null || as === "" || as === null) continue;
    const h = Number(hs);
    const a = Number(as);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) continue;
    rows.push({
      participant_id: user.id,
      match_id: id,
      home_score: h,
      away_score: a,
    });
  }

  if (rows.length === 0) {
    return {
      ok: true,
      saved: 0,
      locked: lockedSet.size,
    };
  }

  const { error } = await supa
    .from("predictions")
    .upsert(rows, { onConflict: "participant_id,match_id" });
  if (error) {
    return { ok: false, saved: 0, locked: lockedSet.size, error: error.message };
  }

  revalidatePath("/play");
  revalidatePath("/play/posiciones");
  return { ok: true, saved: rows.length, locked: lockedSet.size };
}

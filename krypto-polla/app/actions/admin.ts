"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { syncFromApi } from "@/lib/api-football";
import { recalcAllPoints, recalcPointsForMatch } from "@/lib/recalc";
import { randomCode } from "@/lib/utils";

export interface ActionResult {
  ok: boolean;
  message: string;
}

async function guard(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, message: "Solo el admin puede ejecutar esta acción." };
  }
}

export async function syncFixtureAction(): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    const r = await syncFromApi();
    await recalcAllPoints();
    revalidatePath("/admin/partidos");
    revalidatePath("/play");
    revalidatePath("/play/posiciones");
    return {
      ok: true,
      message: `Sync OK · ${r.matches_upserted} partidos, ${r.teams_upserted} equipos, ${r.results_updated} con resultado.`,
    };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function recalcAction(): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const r = await recalcAllPoints();
  revalidatePath("/play/posiciones");
  return { ok: true, message: `Recalculados ${r.updated} pronósticos.` };
}

export async function setResultAction(formData: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const matchId = Number(formData.get("match_id"));
  const homeRaw = formData.get("home_score");
  const awayRaw = formData.get("away_score");
  const finished = formData.get("finished") === "on";
  if (!Number.isFinite(matchId)) {
    return { ok: false, message: "match_id inválido" };
  }
  const home = homeRaw === "" || homeRaw === null ? null : Number(homeRaw);
  const away = awayRaw === "" || awayRaw === null ? null : Number(awayRaw);

  const { error } = await db()
    .from("matches")
    .update({
      home_score: home,
      away_score: away,
      status: finished ? "finished" : "scheduled",
    })
    .eq("id", matchId);
  if (error) return { ok: false, message: error.message };

  await recalcPointsForMatch(matchId);
  revalidatePath("/admin/partidos");
  revalidatePath("/play");
  revalidatePath("/play/posiciones");
  return { ok: true, message: "Resultado guardado." };
}

export async function updateRulesAction(formData: FormData): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const exact = Number(formData.get("exact_score"));
  const winner = Number(formData.get("winner"));
  const diff = Number(formData.get("goal_difference"));
  const one = Number(formData.get("one_team_score"));
  if (![exact, winner, diff, one].every((n) => Number.isFinite(n) && n >= 0)) {
    return { ok: false, message: "Valores de puntaje inválidos." };
  }

  const multipliers: Record<string, number> = {};
  for (const k of formData.keys()) {
    const m = k.match(/^mult_(.+)$/);
    if (!m) continue;
    const v = Number(formData.get(k));
    if (Number.isFinite(v) && v > 0) multipliers[m[1]] = v;
  }

  const { error } = await db()
    .from("scoring_rules")
    .update({
      exact_score: exact,
      winner,
      goal_difference: diff,
      one_team_score: one,
      multipliers,
    })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  await recalcAllPoints();
  revalidatePath("/play/info");
  revalidatePath("/play/posiciones");
  revalidatePath("/admin/reglas");
  return { ok: true, message: "Reglas actualizadas y puntos recalculados." };
}

export async function createParticipantAction(
  formData: FormData
): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const name = String(formData.get("name") ?? "").trim();
  const role = formData.get("role") === "admin" ? "admin" : "player";
  const codeRaw = String(formData.get("invite_code") ?? "").trim().toUpperCase();
  if (!name) return { ok: false, message: "Nombre requerido" };
  const code = codeRaw || randomCode(6);

  const { error } = await db().from("participants").insert({
    name,
    invite_code: code,
    role,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/participantes");
  return { ok: true, message: `Participante creado · código ${code}` };
}

export async function deleteParticipantAction(
  formData: FormData
): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = String(formData.get("id"));
  if (!id) return { ok: false, message: "id requerido" };
  const { error } = await db().from("participants").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/participantes");
  return { ok: true, message: "Participante eliminado." };
}

export async function regenerateCodeAction(
  formData: FormData
): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const id = String(formData.get("id"));
  if (!id) return { ok: false, message: "id requerido" };
  const code = randomCode(6);
  const { error } = await db()
    .from("participants")
    .update({ invite_code: code })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/participantes");
  return { ok: true, message: `Nuevo código: ${code}` };
}

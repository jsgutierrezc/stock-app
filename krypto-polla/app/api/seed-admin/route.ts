import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Crea el primer admin si la tabla `participants` está vacía.
 * Útil para el primer despliegue. Después de tener un admin, este endpoint
 * deja de hacer cualquier cosa (idempotente).
 *
 * Llamar manualmente una vez:
 *   curl -X POST https://tu-dominio/api/seed-admin -H "Authorization: Bearer <ADMIN_TOKEN>"
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.get("authorization");
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supa = db();
  const { count } = await supa
    .from("participants")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, created: false, reason: "ya existen participantes" });
  }

  const name = process.env.SEED_ADMIN_NAME?.trim() || "Admin";
  const code = (process.env.SEED_ADMIN_CODE || "NATIADMIN").trim().toUpperCase();

  const { data, error } = await supa
    .from("participants")
    .insert({ name, invite_code: code, role: "admin" })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, created: true, participant: data });
}

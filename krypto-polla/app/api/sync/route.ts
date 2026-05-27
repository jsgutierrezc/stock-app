import { NextResponse } from "next/server";
import { syncFromApi } from "@/lib/api-football";
import { recalcAllPoints } from "@/lib/recalc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint para Vercel Cron o llamadas autenticadas.
 * Requiere header `Authorization: Bearer <ADMIN_TOKEN>` o el header
 * `x-vercel-cron` que Vercel inyecta a sus crons.
 */
export async function GET(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (!isVercelCron) {
    if (!token || auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const sync = await syncFromApi();
    const recalc = await recalcAllPoints();
    return NextResponse.json({ ok: true, sync, recalc });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

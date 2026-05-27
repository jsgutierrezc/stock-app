import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { AdminNav } from "@/components/AdminNav";
import { ActionButton } from "@/components/ActionButton";
import { syncFixtureAction, recalcAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = (await currentUser())!;
  const supa = db();
  const [{ count: matches }, { count: finished }, { count: participants }, { count: preds }] =
    await Promise.all([
      supa.from("matches").select("*", { count: "exact", head: true }),
      supa
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "finished"),
      supa.from("participants").select("*", { count: "exact", head: true }),
      supa.from("predictions").select("*", { count: "exact", head: true }),
    ]);

  return (
    <>
      <Header user={user} active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminNav active="/admin" />

        <h1 className="text-2xl font-extrabold mb-4">Panel de administración</h1>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Partidos" value={matches ?? 0} />
          <Stat label="Resultados" value={finished ?? 0} />
          <Stat label="Participantes" value={participants ?? 0} />
          <Stat label="Pronósticos" value={preds ?? 0} />
        </section>

        <section className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Acciones rápidas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold mb-1">
                Sincronizar fixture y resultados
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                Trae el calendario y los marcadores actuales del Mundial 2026
                desde api-football. Después recalcula los puntos.
              </p>
              <ActionButton
                action={syncFixtureAction}
                label="Sincronizar ahora"
                loadingLabel="Sincronizando…"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Recalcular puntos</h3>
              <p className="text-xs text-slate-500 mb-2">
                Vuelve a aplicar las reglas vigentes a todos los pronósticos.
              </p>
              <ActionButton
                action={recalcAction}
                label="Recalcular"
                loadingLabel="Calculando…"
                className="bg-slate-800 hover:bg-slate-900 text-white"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-3xl font-extrabold text-pitch-700 dark:text-pitch-300">
        {value}
      </div>
    </div>
  );
}

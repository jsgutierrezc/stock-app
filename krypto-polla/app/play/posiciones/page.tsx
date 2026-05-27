import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PosicionesPage() {
  const user = (await currentUser())!;
  const supa = db();
  const { data } = await supa
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false });
  const rows = (data ?? []) as LeaderboardRow[];

  return (
    <>
      <Header user={user} active="posiciones" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-extrabold mb-4">Tabla de posiciones</h1>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pitch-700/30 p-8 text-center text-slate-500">
            Aún no hay participantes registrados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-pitch-600 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">#</th>
                  <th className="px-3 py-2 text-left">Participante</th>
                  <th className="px-3 py-2 text-right w-24">Aciertos</th>
                  <th className="px-3 py-2 text-right w-24">Pron.</th>
                  <th className="px-3 py-2 text-right w-24">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const me = r.participant_id === user.id;
                  return (
                    <tr
                      key={r.participant_id}
                      className={
                        "border-t border-pitch-700/10 " +
                        (me ? "bg-pitch-50 dark:bg-pitch-900/30 font-semibold" : "")
                      }
                    >
                      <td className="px-3 py-2">
                        {i + 1}
                        {i === 0 && " 🏆"}
                      </td>
                      <td className="px-3 py-2">
                        {r.name}
                        {me && (
                          <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-pitch-700 dark:text-pitch-300">
                            tú
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{r.hits}</td>
                      <td className="px-3 py-2 text-right">{r.predictions_count}</td>
                      <td className="px-3 py-2 text-right text-pitch-700 dark:text-pitch-300 font-mono">
                        {r.total_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { STAGE_LABEL } from "@/lib/stages";
import type { ScoringRules } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InfoPage() {
  const user = (await currentUser())!;
  const supa = db();
  const { data } = await supa.from("scoring_rules").select("*").eq("id", 1).single();
  const rules = (data ?? null) as ScoringRules | null;

  return (
    <>
      <Header user={user} active="info" />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <section className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm">
          <h1 className="text-2xl font-extrabold mb-2">
            Cómo funciona la Krypto-Polla
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pronostica el marcador de cada partido del Mundial 2026 antes del
            pitazo inicial. Después del kickoff los pronósticos se bloquean. El
            que más puntos sume al final del torneo se lleva la polla de la
            Natillera. Saludos a <strong>Krypto</strong> 🐶.
          </p>
        </section>

        <section className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Reglas de puntaje</h2>
          {rules ? (
            <ul className="space-y-2 text-sm">
              <Rule label="Marcador exacto" value={rules.exact_score} />
              <Rule label="Acertar el ganador (1X2)" value={rules.winner} />
              <Rule
                label="Acertar la diferencia de goles"
                value={rules.goal_difference}
              />
              <Rule
                label="Acertar el marcador de uno de los equipos"
                value={rules.one_team_score}
                suffix="por equipo"
              />
            </ul>
          ) : (
            <p className="text-slate-500">Reglas aún no configuradas.</p>
          )}

          <h3 className="text-sm font-bold mt-5 mb-2">
            Multiplicadores por fase
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {rules &&
              Object.entries(rules.multipliers).map(([stage, mult]) => (
                <div
                  key={stage}
                  className="rounded-lg border border-pitch-700/15 px-3 py-2"
                >
                  <div className="font-semibold">
                    {STAGE_LABEL[stage as keyof typeof STAGE_LABEL] ?? stage}
                  </div>
                  <div className="text-pitch-700 dark:text-pitch-300">
                    × {mult}
                  </div>
                </div>
              ))}
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Marcadores cuentan solo los <strong>90 minutos reglamentarios</strong>{" "}
            (+ tiempo de reposición). No se incluyen prórrogas ni tanda de
            penales.
          </p>
        </section>

        <section className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-2">Recomendaciones</h2>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>
              Ingresa los pronósticos con tiempo, no los dejes para último
              momento.
            </li>
            <li>
              Marcador en blanco <em>no</em> significa cero goles, simplemente
              no cuenta.
            </li>
            <li>
              Haz click en <strong>Guardar pronósticos</strong> antes de salir.
            </li>
          </ol>
        </section>
      </main>
    </>
  );
}

function Rule({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <li className="flex items-center justify-between border-b border-pitch-700/10 pb-1.5 last:border-none">
      <span>{label}</span>
      <span className="font-mono font-semibold text-pitch-700 dark:text-pitch-300">
        {value} pt{value === 1 ? "" : "s"}
        {suffix && <span className="text-xs text-slate-400 ml-1">{suffix}</span>}
      </span>
    </li>
  );
}

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { AdminNav } from "@/components/AdminNav";
import { FormAction } from "@/components/ActionButton";
import { updateRulesAction } from "@/app/actions/admin";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/stages";
import type { ScoringRules } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminReglas() {
  const user = (await currentUser())!;
  const { data } = await db().from("scoring_rules").select("*").eq("id", 1).single();
  const rules = data as ScoringRules;

  return (
    <>
      <Header user={user} active="admin" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <AdminNav active="/admin/reglas" />
        <h1 className="text-2xl font-extrabold mb-4">Reglas de puntaje</h1>
        <p className="text-sm text-slate-500 mb-5">
          Al guardar, los puntos de todos los pronósticos se recalculan automáticamente.
        </p>

        <FormAction
          action={updateRulesAction}
          className="space-y-6 rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm"
        >
          <section className="grid grid-cols-2 gap-4">
            <RuleField name="exact_score" label="Marcador exacto" value={rules.exact_score} />
            <RuleField name="winner" label="Acertar ganador (1X2)" value={rules.winner} />
            <RuleField
              name="goal_difference"
              label="Acertar diferencia de goles"
              value={rules.goal_difference}
            />
            <RuleField
              name="one_team_score"
              label="Acertar marcador de un equipo"
              value={rules.one_team_score}
            />
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2">Multiplicadores por fase</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAGE_ORDER.map((s) => (
                <RuleField
                  key={s}
                  name={`mult_${s}`}
                  label={STAGE_LABEL[s]}
                  value={rules.multipliers[s] ?? 1}
                  min={1}
                />
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-pitch-600 hover:bg-pitch-700 text-white font-semibold px-5 py-2.5 shadow"
            >
              Guardar reglas
            </button>
          </div>
        </FormAction>
      </main>
    </>
  );
}

function RuleField({
  name,
  label,
  value,
  min = 0,
}: {
  name: string;
  label: string;
  value: number;
  min?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        name={name}
        min={min}
        defaultValue={value}
        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 font-mono text-center"
      />
    </label>
  );
}

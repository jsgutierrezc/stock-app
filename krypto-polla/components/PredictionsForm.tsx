"use client";

import { useState, useTransition } from "react";
import { savePredictions } from "@/app/actions/predictions";
import type { MatchWithTeams, Prediction } from "@/lib/types";
import { FlagBadge } from "./FlagBadge";
import { formatKickoff, isKickoffLocked, cn } from "@/lib/utils";
import { STAGE_LABEL } from "@/lib/stages";

interface Props {
  matches: MatchWithTeams[];
  myPredictions: Record<number, Prediction>;
}

export function PredictionsForm({ matches, myPredictions }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const r = await savePredictions(formData);
      if (!r.ok) setStatus(r.error ?? "No se pudo guardar");
      else
        setStatus(
          `Guardados ${r.saved} pronóstico${r.saved === 1 ? "" : "s"}.` +
            (r.locked > 0 ? ` Se omitieron ${r.locked} bloqueados.` : "")
        );
    });
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-pitch-700/30 p-8 text-center text-slate-500">
        Aún no hay partidos cargados. El admin debe sincronizar el fixture
        desde el panel de administración.
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-pitch-700/20 bg-pitch-50 dark:bg-pitch-900/30 text-pitch-900 dark:text-pitch-100 p-4 text-sm">
        <strong>Recomendaciones.</strong> Ingresa los pronósticos con tiempo.
        Marcador en blanco <em>no</em> significa cero goles, simplemente no
        cuenta. Después del pitazo inicial el partido queda bloqueado.
      </div>

      <ul className="divide-y divide-pitch-700/10 rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {matches.map((m) => {
          const locked = isKickoffLocked(m.kickoff_at);
          const mine = myPredictions[m.id];
          const k = formatKickoff(m.kickoff_at);
          const scored =
            m.status === "finished" &&
            m.home_score !== null &&
            m.away_score !== null;
          return (
            <li
              key={m.id}
              className={cn(
                "px-3 py-3 sm:px-4",
                locked && "bg-slate-50 dark:bg-slate-950/40"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 text-[0.7rem] leading-tight text-slate-500 mb-2">
                <span className="font-semibold uppercase">
                  {k.date} · {k.time}
                </span>
                <span className="text-pitch-700 dark:text-pitch-300">
                  {STAGE_LABEL[m.stage]}
                  {m.group_name ? ` · Grupo ${m.group_name}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] sm:grid-cols-[1fr,auto,1fr,auto] items-center gap-2">
                <FlagBadge team={m.home_team} className="min-w-0 truncate" />

                <div className="flex items-center gap-1 justify-self-center">
                  <input
                    type="number"
                    name={`h_${m.id}`}
                    min={0}
                    max={20}
                    defaultValue={mine?.home_score ?? ""}
                    disabled={locked}
                    inputMode="numeric"
                    aria-label="Goles local"
                    className="w-12 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-center font-mono text-base disabled:opacity-60"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    name={`a_${m.id}`}
                    min={0}
                    max={20}
                    defaultValue={mine?.away_score ?? ""}
                    disabled={locked}
                    inputMode="numeric"
                    aria-label="Goles visitante"
                    className="w-12 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-center font-mono text-base disabled:opacity-60"
                  />
                </div>

                <FlagBadge
                  team={m.away_team}
                  align="right"
                  className="min-w-0 truncate justify-end text-right"
                />

                <div className="col-span-3 sm:col-span-1 text-right text-sm sm:w-20">
                  {scored ? (
                    <div className="flex sm:block items-center justify-end gap-3">
                      <span className="font-mono text-pitch-700 dark:text-pitch-300">
                        Final {m.home_score}-{m.away_score}
                      </span>
                      <span className="text-[0.7rem] font-semibold">
                        {mine?.points ?? 0} pts
                      </span>
                    </div>
                  ) : locked ? (
                    <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                      🔒 bloqueado
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 sticky bottom-2">
        <div
          aria-live="polite"
          className="text-sm text-pitch-700 dark:text-pitch-300"
        >
          {status}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pitch-600 hover:bg-pitch-700 text-white font-semibold px-5 py-2.5 shadow disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar pronósticos"}
        </button>
      </div>
    </form>
  );
}

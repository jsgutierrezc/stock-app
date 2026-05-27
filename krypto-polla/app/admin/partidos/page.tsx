import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { AdminNav } from "@/components/AdminNav";
import { FormAction } from "@/components/ActionButton";
import { setResultAction } from "@/app/actions/admin";
import { FlagBadge } from "@/components/FlagBadge";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/stages";
import { formatKickoff } from "@/lib/utils";
import type { Match, Stage, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPartidos({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const user = (await currentUser())!;
  const sp = await searchParams;
  const stage = STAGE_ORDER.includes(sp.stage as Stage) ? (sp.stage as Stage) : null;

  const supa = db();
  const q = supa.from("matches").select("*").order("kickoff_at");
  if (stage) q.eq("stage", stage);
  const [{ data: matches }, { data: teams }] = await Promise.all([
    q,
    supa.from("teams").select("*"),
  ]);
  const teamById = new Map<string, Team>(
    (teams ?? []).map((t) => [t.id, t as Team])
  );

  return (
    <>
      <Header user={user} active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminNav active="/admin/partidos" />
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold">Partidos y resultados</h1>
          <div className="flex flex-wrap gap-1 text-xs">
            <Chip label="Todos" href="/admin/partidos" active={!stage} />
            {STAGE_ORDER.map((s) => (
              <Chip
                key={s}
                label={STAGE_LABEL[s]}
                href={`/admin/partidos?stage=${s}`}
                active={stage === s}
              />
            ))}
          </div>
        </div>

        {(matches ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            No hay partidos cargados aún. Sincroniza el fixture desde el
            Dashboard.
          </div>
        ) : (
          <ul className="space-y-2">
            {(matches ?? []).map((m) => (
              <MatchRow
                key={m.id}
                match={m as Match}
                home={m.home_team_id ? teamById.get(m.home_team_id) ?? null : null}
                away={m.away_team_id ? teamById.get(m.away_team_id) ?? null : null}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={
        "rounded-full border px-3 py-1 " +
        (active
          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
          : "border-slate-300 hover:border-slate-600")
      }
    >
      {label}
    </a>
  );
}

function MatchRow({
  match,
  home,
  away,
}: {
  match: Match;
  home: Team | null;
  away: Team | null;
}) {
  const k = formatKickoff(match.kickoff_at);
  const finished = match.status === "finished";
  return (
    <li className="rounded-lg border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-3 shadow-sm">
      <FormAction action={setResultAction} className="grid grid-cols-[120px,1fr,auto,1fr,auto] items-center gap-3">
        <input type="hidden" name="match_id" value={match.id} />
        <div className="text-xs leading-tight">
          <div className="font-semibold uppercase">{k.date}</div>
          <div className="text-slate-500">{k.time}</div>
          <div className="text-[0.65rem] text-pitch-700 dark:text-pitch-300">
            {STAGE_LABEL[match.stage]}
            {match.group_name ? ` · ${match.group_name}` : ""}
          </div>
        </div>
        <FlagBadge team={home} />
        <div className="flex items-center gap-1">
          <input
            type="number"
            name="home_score"
            min={0}
            max={20}
            defaultValue={match.home_score ?? ""}
            className="w-14 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-center font-mono"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            name="away_score"
            min={0}
            max={20}
            defaultValue={match.away_score ?? ""}
            className="w-14 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-center font-mono"
          />
        </div>
        <FlagBadge team={away} align="right" className="justify-end" />
        <div className="flex flex-col items-end gap-1">
          <label className="text-xs inline-flex items-center gap-1">
            <input type="checkbox" name="finished" defaultChecked={finished} />
            finalizado
          </label>
          <button
            type="submit"
            className="rounded bg-pitch-600 hover:bg-pitch-700 text-white text-xs font-semibold px-3 py-1.5"
          >
            Guardar
          </button>
        </div>
      </FormAction>
    </li>
  );
}

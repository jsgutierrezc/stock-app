import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { PredictionsForm } from "@/components/PredictionsForm";
import type {
  Match,
  MatchWithTeams,
  Prediction,
  Stage,
  Team,
} from "@/lib/types";
import { STAGE_ORDER } from "@/lib/stages";

export const dynamic = "force-dynamic";

const STAGE_LABEL_SHORT: Record<Stage, string> = {
  group: "Grupos",
  round_of_32: "16vos",
  round_of_16: "8vos",
  quarter: "Cuartos",
  semi: "Semis",
  third_place: "3er puesto",
  final: "Final",
};

export default async function PronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const user = (await currentUser())!;
  const sp = await searchParams;
  const stageFilter = STAGE_ORDER.includes(sp.stage as Stage)
    ? (sp.stage as Stage)
    : null;

  const supa = db();
  const matchesQ = supa.from("matches").select("*").order("kickoff_at");
  if (stageFilter) matchesQ.eq("stage", stageFilter);

  const [{ data: matches }, { data: teams }, { data: preds }] = await Promise.all([
    matchesQ,
    supa.from("teams").select("*"),
    supa.from("predictions").select("*").eq("participant_id", user.id),
  ]);

  const teamById = new Map<string, Team>(
    (teams ?? []).map((t) => [t.id, t as Team])
  );
  const matchesWithTeams: MatchWithTeams[] = ((matches ?? []) as Match[]).map(
    (m) => ({
      ...m,
      home_team: m.home_team_id ? teamById.get(m.home_team_id) ?? null : null,
      away_team: m.away_team_id ? teamById.get(m.away_team_id) ?? null : null,
    })
  );

  const myPredsMap: Record<number, Prediction> = {};
  for (const p of (preds ?? []) as Prediction[]) myPredsMap[p.match_id] = p;

  const stagesPresent = Array.from(
    new Set(((matches ?? []) as Match[]).map((m) => m.stage))
  ).sort((a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b));

  return (
    <>
      <Header user={user} active="pronosticos" />
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {stagesPresent.length > 1 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <StageChip label="Todos" href="/play" active={!stageFilter} />
            {stagesPresent.map((s) => (
              <StageChip
                key={s}
                label={STAGE_LABEL_SHORT[s]}
                href={`/play?stage=${s}`}
                active={stageFilter === s}
              />
            ))}
          </div>
        )}
        <PredictionsForm matches={matchesWithTeams} myPredictions={myPredsMap} />
      </main>
    </>
  );
}

function StageChip({
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
        "rounded-full border px-3 py-1 transition " +
        (active
          ? "bg-pitch-600 border-pitch-600 text-white"
          : "border-pitch-700/20 hover:border-pitch-600 text-slate-600 dark:text-slate-300")
      }
    >
      {label}
    </a>
  );
}

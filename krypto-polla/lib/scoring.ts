import type { ScoringRules, Stage } from "./types";

export interface Score {
  home: number;
  away: number;
}

/**
 * Reglas:
 *   - Marcador exacto       => exact_score (no acumula extras)
 *   - Acierta ganador (1X2) => + winner
 *   - Acierta diferencia    => + goal_difference (sólo si no fue exacto)
 *   - Acierta marcador de uno de los dos equipos => + one_team_score por cada uno
 * Se multiplica por el factor de la fase (group/octavos/cuartos/...).
 *
 * Aplica al resultado de 90 minutos reglamentarios + tiempo de reposición
 * (no incluye prórroga ni penales). El admin almacena home_score/away_score
 * según ese criterio.
 */
export function calculatePoints(
  prediction: Score,
  actual: Score,
  rules: ScoringRules,
  stage: Stage
): number {
  const mult = rules.multipliers[stage] ?? 1;
  if (
    prediction.home === actual.home &&
    prediction.away === actual.away
  ) {
    return rules.exact_score * mult;
  }

  let pts = 0;
  const predSign = Math.sign(prediction.home - prediction.away);
  const actSign = Math.sign(actual.home - actual.away);
  if (predSign === actSign) pts += rules.winner;

  const predDiff = prediction.home - prediction.away;
  const actDiff = actual.home - actual.away;
  if (predDiff === actDiff) pts += rules.goal_difference;

  if (prediction.home === actual.home) pts += rules.one_team_score;
  if (prediction.away === actual.away) pts += rules.one_team_score;

  return pts * mult;
}

export function isMatchScored(
  m: { home_score: number | null; away_score: number | null; status: string }
): boolean {
  return (
    m.status === "finished" &&
    m.home_score !== null &&
    m.away_score !== null
  );
}

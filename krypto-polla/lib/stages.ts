import type { Stage } from "./types";

export const STAGE_ORDER: Stage[] = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

export const STAGE_LABEL: Record<Stage, string> = {
  group: "Fase de grupos",
  round_of_32: "Dieciseisavos",
  round_of_16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinal",
  third_place: "Tercer puesto",
  final: "Final",
};

/**
 * api-football devuelve la fase como string libre. Lo normalizamos.
 */
export function normalizeStage(round: string | null | undefined): Stage {
  const r = (round ?? "").toLowerCase();
  if (r.includes("group") || r.includes("grupo")) return "group";
  if (r.includes("1/16") || r.includes("32")) return "round_of_32";
  if (r.includes("1/8") || r.includes("16") || r.includes("octav")) return "round_of_16";
  if (r.includes("quarter") || r.includes("cuart") || r.includes("1/4")) return "quarter";
  if (r.includes("semi")) return "semi";
  if (r.includes("3rd") || r.includes("tercer")) return "third_place";
  if (r.includes("final")) return "final";
  return "group";
}

export function extractGroupName(round: string | null | undefined): string | null {
  if (!round) return null;
  const m = round.match(/Group\s+([A-L])/i) ?? round.match(/Grupo\s+([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

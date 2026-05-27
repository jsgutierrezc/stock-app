import "server-only";
import { db } from "./supabase";
import { normalizeStage, extractGroupName } from "./stages";
import type { MatchStatus } from "./types";

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    fulltime?: { home: number | null; away: number | null };
    halftime?: { home: number | null; away: number | null };
  };
}

const STATUS_MAP: Record<string, MatchStatus> = {
  NS: "scheduled",
  TBD: "scheduled",
  "1H": "live",
  HT: "live",
  "2H": "live",
  ET: "live",
  BT: "live",
  P: "live",
  SUSP: "live",
  INT: "live",
  LIVE: "live",
  FT: "finished",
  AET: "finished",
  PEN: "finished",
  AWD: "finished",
  WO: "finished",
  PST: "postponed",
  CANC: "cancelled",
  ABD: "cancelled",
};

function endpoint(path: string): string {
  const host = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";
  return `https://${host}${path}`;
}

export async function fetchFixtures(): Promise<ApiFixture[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY no configurada");
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";

  const url = endpoint(`/fixtures?league=${league}&season=${season}`);
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": key,
      "x-rapidapi-key": key,
      "x-rapidapi-host": process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`api-football ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (!Array.isArray(json.response)) {
    throw new Error("Respuesta inválida de api-football");
  }
  return json.response as ApiFixture[];
}

export interface SyncReport {
  matches_upserted: number;
  teams_upserted: number;
  results_updated: number;
}

export async function syncFromApi(): Promise<SyncReport> {
  const fixtures = await fetchFixtures();
  const supa = db();

  const teamMap = new Map<
    string,
    { id: string; name: string; code: string | null; flag: string | null }
  >();
  for (const f of fixtures) {
    for (const side of [f.teams.home, f.teams.away]) {
      if (!teamMap.has(String(side.id))) {
        teamMap.set(String(side.id), {
          id: String(side.id),
          name: side.name,
          code: null,
          flag: side.logo,
        });
      }
    }
  }

  if (teamMap.size > 0) {
    const { error } = await supa
      .from("teams")
      .upsert(Array.from(teamMap.values()), { onConflict: "id" });
    if (error) throw error;
  }

  let resultsUpdated = 0;
  const matchRows = fixtures.map((f) => {
    const status = STATUS_MAP[f.fixture.status.short] ?? "scheduled";
    const ft = f.score?.fulltime;
    const home = ft?.home ?? f.goals.home;
    const away = ft?.away ?? f.goals.away;
    if (status === "finished" && home !== null && away !== null) resultsUpdated++;
    return {
      id: f.fixture.id,
      stage: normalizeStage(f.league.round),
      group_name: extractGroupName(f.league.round),
      kickoff_at: f.fixture.date,
      home_team_id: String(f.teams.home.id),
      away_team_id: String(f.teams.away.id),
      home_score: status === "finished" ? home : null,
      away_score: status === "finished" ? away : null,
      status,
      api_status: f.fixture.status.short,
    };
  });

  if (matchRows.length > 0) {
    const { error } = await supa.from("matches").upsert(matchRows, { onConflict: "id" });
    if (error) throw error;
  }

  return {
    matches_upserted: matchRows.length,
    teams_upserted: teamMap.size,
    results_updated: resultsUpdated,
  };
}

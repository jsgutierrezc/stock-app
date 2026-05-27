export type Role = "admin" | "player";

export type Stage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Participant {
  id: string;
  name: string;
  invite_code: string;
  role: Role;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface Match {
  id: number;
  stage: Stage;
  group_name: string | null;
  kickoff_at: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  api_status: string | null;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
}

export interface Prediction {
  id: string;
  participant_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ScoringRules {
  id: 1;
  exact_score: number;
  winner: number;
  goal_difference: number;
  one_team_score: number;
  multipliers: Record<Stage, number>;
  updated_at: string;
}

export interface LeaderboardRow {
  participant_id: string;
  name: string;
  total_points: number;
  predictions_count: number;
  hits: number;
}

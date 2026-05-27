-- Krypto-Polla Natillera · Mundial 2026
-- Schema inicial. Auth se maneja en el backend con códigos de invitación
-- (cookie HTTP-only), por eso todo el acceso a la DB ocurre vía service role
-- desde el server. No habilitamos RLS porque la anon key no se expone.

create extension if not exists "pgcrypto";

create table if not exists participants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text not null unique,
  role         text not null default 'player' check (role in ('admin','player')),
  created_at   timestamptz not null default now()
);

create table if not exists teams (
  id    text primary key,           -- api-football team id (string para flexibilidad)
  name  text not null,
  code  text,                       -- ej 'COL'
  flag  text                        -- URL al SVG/PNG
);

create table if not exists matches (
  id              bigint primary key,        -- fixture id de api-football
  stage           text not null check (stage in (
                    'group','round_of_32','round_of_16','quarter','semi','third_place','final'
                  )),
  group_name      text,
  kickoff_at      timestamptz not null,
  home_team_id    text references teams(id),
  away_team_id    text references teams(id),
  home_score      int,
  away_score      int,
  status          text not null default 'scheduled' check (status in (
                    'scheduled','live','finished','postponed','cancelled'
                  )),
  api_status      text,                       -- short status de api-football
  updated_at      timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on matches(kickoff_at);
create index if not exists matches_stage_idx   on matches(stage);

create table if not exists predictions (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references participants(id) on delete cascade,
  match_id        bigint not null references matches(id) on delete cascade,
  home_score      int not null check (home_score >= 0),
  away_score      int not null check (away_score >= 0),
  points          int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (participant_id, match_id)
);

create index if not exists predictions_participant_idx on predictions(participant_id);
create index if not exists predictions_match_idx       on predictions(match_id);

-- Reglas editables por admin (siempre fila única id=1).
create table if not exists scoring_rules (
  id               int primary key default 1,
  exact_score      int not null default 5,
  winner           int not null default 3,
  goal_difference  int not null default 2,
  one_team_score   int not null default 1,
  multipliers      jsonb not null default '{
    "group": 1,
    "round_of_32": 1,
    "round_of_16": 2,
    "quarter": 2,
    "semi": 2,
    "third_place": 2,
    "final": 2
  }'::jsonb,
  updated_at       timestamptz not null default now(),
  check (id = 1)
);

insert into scoring_rules (id) values (1) on conflict do nothing;

-- Trigger para mantener updated_at sincronizado en matches y predictions
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists matches_touch on matches;
create trigger matches_touch before update on matches
  for each row execute function touch_updated_at();

drop trigger if exists predictions_touch on predictions;
create trigger predictions_touch before update on predictions
  for each row execute function touch_updated_at();

drop trigger if exists rules_touch on scoring_rules;
create trigger rules_touch before update on scoring_rules
  for each row execute function touch_updated_at();

-- Vista de leaderboard
create or replace view leaderboard as
  select
    pa.id              as participant_id,
    pa.name            as name,
    coalesce(sum(pr.points), 0)::int as total_points,
    count(pr.id)       as predictions_count,
    count(pr.id) filter (where pr.points > 0) as hits
  from participants pa
  left join predictions pr on pr.participant_id = pa.id
  group by pa.id, pa.name
  order by total_points desc, hits desc, pa.name asc;

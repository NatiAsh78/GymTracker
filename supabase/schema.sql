-- GymTracker database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
--
-- The three tables below (gym.exercises, gym.workout_sessions,
-- gym.exercise_logs) already existed in this project before this file was
-- written. This script does NOT recreate them — it only adds the columns
-- the app needs that were missing, and sets up access (grants + RLS).
-- Safe to re-run.
--
-- Access requires a signed-in Supabase Auth user (see js/auth.js). There is
-- no self-serve signup in the app — create your account once via
-- Authentication -> Users -> Add user in the Supabase dashboard. This is a
-- single-user app for now; every authenticated user gets full access
-- (no per-user ownership) — see CLAUDE.md's "Multiple users (future)".

-- ---------------------------------------------------------------------
-- Missing columns the app needs
-- ---------------------------------------------------------------------
alter table gym.workout_sessions add column if not exists body_weight numeric;
alter table gym.workout_sessions add column if not exists body_fat numeric;
alter table gym.exercise_logs add column if not exists recommendation text;

-- code must be unique so the app (and the seed script) can upsert by code
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exercises_code_key'
  ) then
    alter table gym.exercises add constraint exercises_code_key unique (code);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Access grants — a custom schema (anything other than "public") is not
-- reachable by the anon/authenticated roles by default, even once it's
-- exposed in Data API settings. Only "authenticated" gets table access;
-- "anon" (unauthenticated) is granted nothing, so a request without a
-- valid login session is rejected before RLS is even evaluated.
-- ---------------------------------------------------------------------
revoke all on gym.exercises, gym.workout_sessions, gym.exercise_logs from anon;
revoke usage on schema gym from anon;

grant usage on schema gym to authenticated;
grant select, insert, update, delete on gym.exercises, gym.workout_sessions, gym.exercise_logs to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security — requires a signed-in user (auth.uid() is not null).
-- ---------------------------------------------------------------------
alter table gym.exercises enable row level security;
alter table gym.workout_sessions enable row level security;
alter table gym.exercise_logs enable row level security;

drop policy if exists "public read exercises" on gym.exercises;
drop policy if exists "authenticated read exercises" on gym.exercises;
create policy "authenticated read exercises" on gym.exercises
  for select using (auth.uid() is not null);

drop policy if exists "public read workout_sessions" on gym.workout_sessions;
drop policy if exists "authenticated read workout_sessions" on gym.workout_sessions;
create policy "authenticated read workout_sessions" on gym.workout_sessions
  for select using (auth.uid() is not null);
drop policy if exists "public write workout_sessions" on gym.workout_sessions;
drop policy if exists "authenticated write workout_sessions" on gym.workout_sessions;
create policy "authenticated write workout_sessions" on gym.workout_sessions
  for insert with check (auth.uid() is not null);
drop policy if exists "public delete workout_sessions" on gym.workout_sessions;
drop policy if exists "authenticated delete workout_sessions" on gym.workout_sessions;
create policy "authenticated delete workout_sessions" on gym.workout_sessions
  for delete using (auth.uid() is not null);

drop policy if exists "public read exercise_logs" on gym.exercise_logs;
drop policy if exists "authenticated read exercise_logs" on gym.exercise_logs;
create policy "authenticated read exercise_logs" on gym.exercise_logs
  for select using (auth.uid() is not null);
drop policy if exists "public write exercise_logs" on gym.exercise_logs;
drop policy if exists "authenticated write exercise_logs" on gym.exercise_logs;
create policy "authenticated write exercise_logs" on gym.exercise_logs
  for insert with check (auth.uid() is not null);
drop policy if exists "public delete exercise_logs" on gym.exercise_logs;
drop policy if exists "authenticated delete exercise_logs" on gym.exercise_logs;
create policy "authenticated delete exercise_logs" on gym.exercise_logs
  for delete using (auth.uid() is not null);

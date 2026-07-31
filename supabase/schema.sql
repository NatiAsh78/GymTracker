-- GymTracker database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
--
-- The three tables below (gym.exercises, gym.workout_sessions,
-- gym.exercise_logs) already existed in this project before this file was
-- written. This script does NOT recreate them — it only adds the columns
-- the app needs that were missing, and sets up access (grants + RLS).
-- Safe to re-run.
--
-- IMPORTANT: RLS policies below are intentionally OPEN (allow the public
-- "anon" key to read and write) because the app has no authentication yet.
-- This is acceptable ONLY while the app runs locally / privately. Before
-- hosting this app publicly (e.g. so it's reachable from a phone), add
-- Supabase Auth and replace these policies with ones scoped to auth.uid().

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
-- exposed in Data API settings. This grants the same access level the
-- open RLS policies below describe.
-- ---------------------------------------------------------------------
grant usage on schema gym to anon, authenticated;
grant select, insert, update, delete on gym.exercises, gym.workout_sessions, gym.exercise_logs to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security — OPEN for now (no auth in the app yet). See warning
-- at the top of this file before hosting the app publicly.
-- ---------------------------------------------------------------------
alter table gym.exercises enable row level security;
alter table gym.workout_sessions enable row level security;
alter table gym.exercise_logs enable row level security;

drop policy if exists "public read exercises" on gym.exercises;
create policy "public read exercises" on gym.exercises
  for select using (true);

drop policy if exists "public read workout_sessions" on gym.workout_sessions;
create policy "public read workout_sessions" on gym.workout_sessions
  for select using (true);
drop policy if exists "public write workout_sessions" on gym.workout_sessions;
create policy "public write workout_sessions" on gym.workout_sessions
  for insert with check (true);
drop policy if exists "public delete workout_sessions" on gym.workout_sessions;
create policy "public delete workout_sessions" on gym.workout_sessions
  for delete using (true);

drop policy if exists "public read exercise_logs" on gym.exercise_logs;
create policy "public read exercise_logs" on gym.exercise_logs
  for select using (true);
drop policy if exists "public write exercise_logs" on gym.exercise_logs;
create policy "public write exercise_logs" on gym.exercise_logs
  for insert with check (true);
drop policy if exists "public delete exercise_logs" on gym.exercise_logs;
create policy "public delete exercise_logs" on gym.exercise_logs
  for delete using (true);

-- Seed gym.exercises with the current exercise list (matches js/data.js GROUPS).
-- Run this AFTER schema.sql, once, in the Supabase SQL Editor.
-- Safe to re-run: it upserts by `code`.
--
-- Note: muscle-group presentation metadata (Hebrew name, color, dashboard
-- order) is NOT stored here — it stays as a small static lookup in
-- js/data.js, keyed by `muscle_group`. Only per-exercise data lives here.

insert into gym.exercises
  (code, name, name_he, muscle_group, weight_label, reps_label, no_weight, increment_kg, display_order, is_active)
values
  ('lat_pulldown',              'Lat Pulldown',              'משיכה עליונה',           'back',      null,          null,     false, 5,   1, true),
  ('seated_row',                'Seated Row',                'חתירה בישיבה',           'back',      null,          null,     false, 5,   2, true),
  ('dumbbell_row',              'Dumbbell Row',              'חתירה עם דאמבל',         'back',      'ק"ג לכל יד',  null,     false, 5,   3, true),

  ('chest_press_machine',       'Chest Press Machine',       'לחיצת חזה במכונה',       'chest',     null,          null,     false, 2.5, 1, true),
  ('dumbbell_chest_press',      'Dumbbell Chest Press',      'לחיצת חזה עם דאמבלים',   'chest',     'ק"ג לכל יד',  null,     false, 2.5, 2, true),
  ('pec_deck',                  'Pec Deck',                  'פרפר במכונה',            'chest',     null,          null,     false, 2.5, 3, true),

  ('shoulder_press_machine',    'Shoulder Press Machine',    'לחיצת כתפיים במכונה',    'shoulders', null,          null,     false, 2.5, 1, true),
  ('dumbbell_shoulder_press',   'Dumbbell Shoulder Press',   'לחיצת כתפיים עם דאמבלים','shoulders', 'ק"ג לכל יד',  null,     false, 2.5, 2, true),
  ('kettlebell_shoulder_press', 'Kettlebell Shoulder Press', 'לחיצת כתפיים עם קטלבל',  'shoulders', 'ק"ג לכל יד',  null,     false, 2.5, 3, true),

  ('leg_press',                 'Leg Press',                 'לחיצת רגליים',           'quads',     null,          null,     false, 5,   1, true),
  ('goblet_squat',              'Goblet Squat',              'סקוואט גביע',            'quads',     null,          null,     false, 5,   2, true),
  ('leg_extension',             'Leg Extension',             'פשיטת ברך במכונה',       'quads',     null,          null,     false, 5,   3, true),

  ('leg_curl',                  'Leg Curl',                  'כפיפת ברך במכונה',       'posterior', null,          null,     false, 5,   1, true),
  ('romanian_deadlift',         'Romanian Deadlift',         'דדליפט רומני',           'posterior', null,          null,     false, 5,   2, true),
  ('hip_thrust',                'Hip Thrust',                'הרמת אגן',               'posterior', null,          null,     false, 5,   3, true),

  ('dumbbell_curl',             'Dumbbell Curl',             'כפיפת מרפק עם דאמבלים',  'biceps',    'ק"ג לכל יד',  null,     false, 2.5, 1, true),

  ('tricep_pushdown',           'Tricep Pushdown',           'פשיטת מרפק בכבל',        'triceps',   null,          null,     false, 2.5, 1, true),

  ('plank',                     'Plank',                     'פלאנק',                  'core',      null,          'שניות', true,  0,   1, true),
  ('tabata_abs',                'Tabata Abs',                'טאבטה בטן',              'core',      null,          'סבבים', true,  0,   2, true)
on conflict (code) do update set
  name          = excluded.name,
  name_he       = excluded.name_he,
  muscle_group  = excluded.muscle_group,
  weight_label  = excluded.weight_label,
  reps_label    = excluded.reps_label,
  no_weight     = excluded.no_weight,
  increment_kg  = excluded.increment_kg,
  display_order = excluded.display_order,
  is_active     = excluded.is_active;

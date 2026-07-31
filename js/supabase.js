// Client for the gym schema. RLS is intentionally open for now (no auth in
// the app yet) — see the warning at the top of supabase/schema.sql before
// hosting this app publicly.
const supabaseClient = window.supabase.createClient(
  CONFIG.supabaseUrl,
  CONFIG.supabaseKey,
  { db: { schema: 'gym' } }
);

import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the Supabase service role key, which bypasses Row Level
// Security. Never import this into a client component or otherwise expose
// it to the browser — it exists only for trusted server-side operations
// (e.g. Storage uploads) that need elevated permissions beyond the anon key.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

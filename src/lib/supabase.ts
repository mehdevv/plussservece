import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function envStr(value: string | undefined) {
  if (!value) return "";
  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

let cached: SupabaseClient | null | undefined;

export function getSupabase() {
  if (cached !== undefined) return cached;

  const url = envStr(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = envStr(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey || url.includes("YOUR_PROJECT")) {
    cached = null;
    return cached;
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: async (_name, _timeout, fn) => fn(),
    },
  });

  return cached;
}

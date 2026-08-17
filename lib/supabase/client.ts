import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient<Database>(config.url, config.publishableKey);
  return browserClient;
}

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getServerAuthState() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { isConfigured: false, claims: null } as const;
  }

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return { isConfigured: true, claims: null } as const;
    }

    return { isConfigured: true, claims: data.claims } as const;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error(`[Supabase Auth] No se pudo validar la sesión: ${message}`);
    }

    return { isConfigured: true, claims: null } as const;
  }
}

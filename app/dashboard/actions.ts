"use server";

import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(`${APP_ROUTES.login}?authError=configuration`);
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect(`${APP_ROUTES.dashboard}?logoutError=1`);
  }

  redirect(APP_ROUTES.home);
}

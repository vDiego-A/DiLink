"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { APP_ROUTES } from "@/lib/config";
import type { PlanId } from "@/lib/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function FreshAccountReset({ plan }: { plan: PlanId }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const resetSession = async () => {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        setError("No pudimos conectar con Supabase en este entorno.");
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("No pudimos cerrar la sesión anterior. Inténtalo nuevamente.");
        return;
      }

      const destination = plan === "pro" ? `${APP_ROUTES.signup}?plan=pro` : APP_ROUTES.signup;
      router.replace(destination);
      router.refresh();
    };

    void resetSession();
  }, [plan, router]);

  if (error) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] p-4 text-sm text-[var(--muted)]" role="alert">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden="true" />
        {error}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm font-semibold text-[var(--muted)]" role="status">
      <LoaderCircle className="size-5 animate-spin text-violet-500" aria-hidden="true" />
      Preparando un registro nuevo…
    </div>
  );
}

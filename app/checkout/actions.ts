"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SubmitPaymentResult =
  | { ok: true; status: "pending"; submittedAt: string }
  | { ok: false; code: "validation" | "authentication" | "setup" | "already_pro" | "unexpected"; message: string };

export async function submitProPayment(input: unknown): Promise<SubmitPaymentResult> {
  if (!input || typeof input !== "object") {
    return { ok: false, code: "validation", message: "Completa los datos del pago." };
  }

  const values = input as Record<string, unknown>;
  const payerPhone = typeof values.payerPhone === "string"
    ? values.payerPhone.replace(/\D/g, "")
    : "";
  const reference = typeof values.reference === "string"
    ? values.reference.replace(/\D/g, "")
    : "";

  if (!/^\d{10,15}$/.test(payerPhone)) {
    return { ok: false, code: "validation", message: "Introduce un teléfono válido de entre 10 y 15 números." };
  }

  if (!/^\d{4,12}$/.test(reference)) {
    return { ok: false, code: "validation", message: "Introduce una referencia válida de entre 4 y 12 números." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, code: "setup", message: "Falta completar la configuración de Supabase." };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, code: "authentication", message: "Tu sesión venció. Inicia sesión nuevamente." };
  }

  const { data, error } = await supabase.rpc("submit_pro_payment", {
    payer_phone_input: payerPhone,
    payment_reference_input: reference,
  });

  if (error || !data?.[0]) {
    if (process.env.NODE_ENV === "development" && error) {
      console.error(`[Supabase Payments] No se pudo reportar el pago: ${error.message}`);
    }

    if (error?.message.includes("already_pro")) {
      return { ok: false, code: "already_pro", message: "Tu cuenta ya tiene DiLink Pro activo." };
    }

    if (error?.code === "PGRST202" || error?.code === "42883" || error?.code === "42P01") {
      return {
        ok: false,
        code: "setup",
        message: "Falta instalar el módulo de pagos Pro en Supabase.",
      };
    }

    return { ok: false, code: "unexpected", message: "No pudimos registrar el pago. Inténtalo nuevamente." };
  }

  revalidatePath(APP_ROUTES.checkout);
  revalidatePath(APP_ROUTES.dashboard);

  return { ok: true, status: "pending", submittedAt: data[0].submitted_at };
}

export async function continueWithFree() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(`${APP_ROUTES.login}?authError=configuration`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(APP_ROUTES.login);

  const cancelResult = await supabase.rpc("cancel_my_pending_payment");
  if (cancelResult.error && cancelResult.error.code !== "PGRST202" && cancelResult.error.code !== "42883") {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Supabase Payments] No se pudo cancelar el pago pendiente: ${cancelResult.error.message}`);
    }
    redirect(`${APP_ROUTES.checkout}?checkoutError=plan`);
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      selected_plan: "free",
      onboarding_completed: user.user_metadata?.onboarding_completed === true,
    },
  });

  if (error) {
    redirect(`${APP_ROUTES.checkout}?checkoutError=plan`);
  }

  await supabase.auth.refreshSession();
  redirect(
    user.user_metadata?.onboarding_completed === true
      ? APP_ROUTES.dashboard
      : `${APP_ROUTES.onboarding}?plan=free`,
  );
}

export async function returnToLogin() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect(APP_ROUTES.login);
}

export async function continueAfterPayment() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect(`${APP_ROUTES.login}?authError=configuration`);

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(APP_ROUTES.login);

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { selected_plan: "pro" },
  });

  if (metadataError) {
    redirect(`${APP_ROUTES.checkout}?checkoutError=plan`);
  }

  await supabase.auth.refreshSession();

  if (authData.user.user_metadata?.onboarding_completed === true) {
    redirect(APP_ROUTES.dashboard);
  }

  redirect(`${APP_ROUTES.onboarding}?plan=pro`);
}

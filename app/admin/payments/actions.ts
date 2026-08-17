"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function reviewPayment(formData: FormData) {
  const paymentId = formData.get("paymentId");
  const decision = formData.get("decision");
  const note = formData.get("note");

  if (
    typeof paymentId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentId) ||
    (decision !== "approved" && decision !== "rejected") ||
    (typeof note === "string" && note.length > 300)
  ) {
    redirect(`${APP_ROUTES.adminPayments}?result=invalid`);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect(`${APP_ROUTES.login}?authError=configuration`);

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(APP_ROUTES.login);

  const { error } = await supabase.rpc("review_pro_payment", {
    payment_request_id: paymentId,
    review_decision: decision,
    review_note_input: typeof note === "string" ? note.trim() || null : null,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Supabase Payments] No se pudo revisar el pago: ${error.message}`);
    }
    redirect(`${APP_ROUTES.adminPayments}?result=error`);
  }

  revalidatePath(APP_ROUTES.adminPayments);
  revalidatePath(APP_ROUTES.dashboard);
  redirect(`${APP_ROUTES.adminPayments}?result=${decision}`);
}

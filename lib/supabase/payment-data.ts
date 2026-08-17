import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PaymentRequestRow, SubscriptionRow } from "@/types/database";

export type PaymentStatusData = {
  payment: PaymentRequestRow | null;
  subscription: SubscriptionRow | null;
  persistenceReady: boolean;
};

export async function getMyPaymentStatus(userId: string): Promise<PaymentStatusData> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { payment: null, subscription: null, persistenceReady: false };

  const [paymentResult, subscriptionResult] = await Promise.all([
    supabase
      .from("payment_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (paymentResult.error || subscriptionResult.error) {
    logPaymentError(
      "leer el estado del pago",
      paymentResult.error?.message ?? subscriptionResult.error?.message ?? "Error desconocido",
    );
    return { payment: null, subscription: null, persistenceReady: false };
  }

  return {
    payment: paymentResult.data,
    subscription: subscriptionResult.data,
    persistenceReady: true,
  };
}

export async function isCurrentUserAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const result = await supabase.rpc("is_dilink_admin");
  if (result.error) {
    logPaymentError("verificar el acceso administrativo", result.error.message);
    return false;
  }

  return result.data === true;
}

export async function getAdminPaymentRequests() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { isAdmin: false, payments: [] as PaymentRequestRow[], persistenceReady: false };

  const adminResult = await supabase.rpc("is_dilink_admin");
  if (adminResult.error) {
    logPaymentError("verificar al administrador", adminResult.error.message);
    return { isAdmin: false, payments: [] as PaymentRequestRow[], persistenceReady: false };
  }

  if (!adminResult.data) {
    return { isAdmin: false, payments: [] as PaymentRequestRow[], persistenceReady: true };
  }

  const paymentsResult = await supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (paymentsResult.error) {
    logPaymentError("leer los pagos pendientes", paymentsResult.error.message);
    return { isAdmin: true, payments: [] as PaymentRequestRow[], persistenceReady: false };
  }

  return {
    isAdmin: true,
    payments: paymentsResult.data ?? [],
    persistenceReady: true,
  };
}

function logPaymentError(context: string, message: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Supabase Payments] No se pudo ${context}: ${message}`);
  }
}

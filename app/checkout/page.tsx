import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPreview } from "@/components/checkout/checkout-preview";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getMyPaymentStatus, isCurrentUserAdmin } from "@/lib/supabase/payment-data";

export const metadata: Metadata = {
  title: "Continuar con Pro",
  description: "Revisa tu plan Pro antes de continuar al pago seguro.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { isConfigured, claims } = await getServerAuthState();

  if (!isConfigured) {
    redirect(`${APP_ROUTES.login}?authError=configuration`);
  }

  if (!claims) redirect(APP_ROUTES.login);

  const query = await searchParams;
  const checkoutError = Array.isArray(query.checkoutError)
    ? query.checkoutError[0]
    : query.checkoutError;
  const [paymentData, isAdmin] = await Promise.all([
    getMyPaymentStatus(claims.sub),
    isCurrentUserAdmin(),
  ]);

  return (
    <CheckoutPreview
      email={typeof claims.email === "string" ? claims.email : ""}
      initialPayment={paymentData.payment ? {
        status: paymentData.payment.status,
        submittedAt: paymentData.payment.created_at,
        reviewNote: paymentData.payment.review_note,
      } : null}
      subscriptionActive={
        isAdmin || (
          paymentData.subscription?.status === "active" &&
          (!paymentData.subscription.current_period_end || new Date(paymentData.subscription.current_period_end) > new Date())
        )
      }
      paymentsReady={paymentData.persistenceReady}
      initialFeedback={
        checkoutError === "plan"
          ? "No pudimos continuar con el plan seleccionado. Inténtalo nuevamente."
          : ""
      }
    />
  );
}

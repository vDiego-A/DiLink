import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Clock3, CreditCard, TriangleAlert } from "lucide-react";
import { reviewPayment } from "@/app/admin/payments/actions";
import { PaymentReviewButton } from "@/components/admin/payment-review-button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getAdminPaymentRequests } from "@/lib/supabase/payment-data";
import type { PaymentRequestRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Verificación de pagos",
  description: "Panel privado para revisar pagos de DiLink Pro.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const { isConfigured, claims } = await getServerAuthState();
  if (!isConfigured) redirect(`${APP_ROUTES.login}?authError=configuration`);
  if (!claims) redirect(APP_ROUTES.login);

  const data = await getAdminPaymentRequests();
  if (data.persistenceReady && !data.isAdmin) notFound();

  const query = await searchParams;
  const result = Array.isArray(query.result) ? query.result[0] : query.result;
  const pendingPayments = data.payments.filter((payment) => payment.status === "pending");
  const reviewedPayments = data.payments.filter((payment) => payment.status !== "pending").slice(0, 20);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href={APP_ROUTES.dashboard} className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">Administración</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Verificación de pagos Pro</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">Comprueba la referencia bancaria antes de aprobar cada solicitud.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold">
            <Clock3 className="size-4 text-amber-500" aria-hidden="true" />
            {pendingPayments.length} pendientes
          </span>
        </div>

        {!data.persistenceReady && (
          <p className="mt-7 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 text-sm text-[var(--muted)]" role="alert">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden="true" />
            Aplica la migración 004 de Supabase y registra tu usuario como administrador para habilitar esta pantalla.
          </p>
        )}

        {result && (
          <p className={`mt-7 rounded-2xl border p-4 text-sm ${result === "approved" ? "border-emerald-400/25 bg-emerald-400/[0.08]" : result === "rejected" ? "border-amber-400/25 bg-amber-400/[0.08]" : "border-rose-400/25 bg-rose-400/[0.08]"}`} role="status">
            {result === "approved" ? "Pago aprobado. DiLink Pro quedó activo durante 30 días." : result === "rejected" ? "Pago rechazado. El usuario podrá enviar una nueva referencia." : "No pudimos completar la revisión. Comprueba el estado de la solicitud."}
          </p>
        )}

        <section className="mt-8 grid gap-4">
          {pendingPayments.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-12 text-center">
              <BadgeCheck className="mx-auto size-7 text-emerald-500" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">No hay pagos pendientes.</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Las nuevas solicitudes aparecerán aquí.</p>
            </div>
          ) : (
            pendingPayments.map((payment) => <PendingPaymentCard key={payment.id} payment={payment} />)
          )}
        </section>

        {reviewedPayments.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Historial reciente</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              {reviewedPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col gap-2 border-b border-[var(--border)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-sm">Ref. {payment.reference}</strong>
                    <p className="mt-1 text-xs text-[var(--muted)]">{payment.payer_phone} · {formatAdminDate(payment.created_at)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${payment.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : payment.status === "rejected" ? "bg-rose-500/10 text-rose-500" : "bg-zinc-500/10 text-[var(--muted)]"}`}>
                    {payment.status === "approved" ? "Aprobado" : payment.status === "rejected" ? "Rechazado" : "Cancelado"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function PendingPaymentCard({ payment }: { payment: PaymentRequestRow }) {
  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
            <CreditCard className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Referencia</p>
            <h2 className="mt-1 text-xl font-semibold">{payment.reference}</h2>
            <p className="mt-2 text-xs text-[var(--muted)]">Teléfono: {payment.payer_phone}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Monto: ${payment.amount_usd.toFixed(2)} · {payment.amount_ves.toLocaleString("es-VE")} Bs</p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">Reportado: {formatAdminDate(payment.created_at)}</p>
          </div>
        </div>

        <form action={reviewPayment} className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <input type="hidden" name="paymentId" value={payment.id} />
          <label className="block text-xs font-semibold">
            Nota de revisión <span className="font-normal text-[var(--muted-soft)]">(opcional)</span>
            <textarea name="note" maxLength={300} rows={2} className="auth-field mt-2 min-h-20 resize-y px-3 py-2" placeholder="Se mostrará si el pago es rechazado." />
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <PaymentReviewButton decision="approved" />
            <PaymentReviewButton decision="rejected" />
          </div>
        </form>
      </div>
    </article>
  );
}

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(new Date(value));
}

"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCheck,
  Clock3,
  Copy,
  Hash,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  continueAfterPayment,
  continueWithFree,
  returnToLogin,
  submitProPayment,
} from "@/app/checkout/actions";
import { Logo } from "@/components/ui/logo";
import { PriceConverter } from "@/components/ui/price-converter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_CONFIG } from "@/lib/config";
import { PAYMENT_CONFIG } from "@/lib/payment";
import { PLAN_CONTENT } from "@/lib/plans";

export function CheckoutPreview({
  email,
  initialPayment,
  subscriptionActive,
  paymentsReady,
  initialFeedback = "",
}: {
  email: string;
  initialPayment: {
    status: "pending" | "approved" | "rejected" | "cancelled";
    submittedAt: string;
    reviewNote: string | null;
  } | null;
  subscriptionActive: boolean;
  paymentsReady: boolean;
  initialFeedback?: string;
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [payment, setPayment] = useState(initialPayment);
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [isReporting, startReporting] = useTransition();
  const paymentStatus = subscriptionActive ? "approved" : payment?.status;

  const copyPaymentDetail = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(""), 1800);
    } catch {
      setFeedback("No pudimos copiar el dato. Selecciónalo manualmente.");
    }
  };

  const preparePaymentReport = () => {
    if (payerPhone.trim().length < 10) {
      setFeedback("Escribe el teléfono desde el que realizaste el Pago Móvil.");
      return;
    }

    if (!/^\d{4,12}$/.test(reference.trim())) {
      setFeedback("Escribe una referencia válida de entre 4 y 12 números.");
      return;
    }

    startReporting(async () => {
      setFeedback("");
      const result = await submitProPayment({ payerPhone, reference });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setPayment({ status: "pending", submittedAt: result.submittedAt, reviewNote: null });
      setFeedback("Pago reportado correctamente. Revisaremos la referencia antes de activar Pro.");
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 pb-12 pt-24 text-[var(--foreground)] sm:px-6 sm:pt-28">
      <div className="auth-page-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute left-[65%] top-12 size-[32rem] -translate-x-1/2 rounded-full bg-violet-500/[0.1] blur-[130px]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--muted)] sm:inline">{email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]">
        <section className="rounded-[2rem] border border-violet-400/25 bg-[linear-gradient(145deg,rgba(124,58,237,0.13),rgba(37,99,235,0.05),var(--surface))] p-6 shadow-[var(--auth-card-shadow)] sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Plan seleccionado
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">DiLink Pro</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{PLAN_CONTENT.pro.description}</p>

          <div className="mt-7 border-b border-[var(--border)] pb-7">
            <PriceConverter />
          </div>

          <ul className="mt-7 space-y-3">
            {PLAN_CONTENT.pro.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-[var(--muted)]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--auth-card-shadow)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--accent-text)]">Método de pago</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Pago Móvil</h2>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Smartphone className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--muted)]">DiLink Pro · Mensual</span>
              <strong>{APP_CONFIG.pricing.proMonthlyLabel}</strong>
            </div>
            <div className="my-4 h-px bg-[var(--border)]" />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <span className="text-sm font-semibold">Monto a pagar</span>
              <div className="text-right">
                <strong className="block text-2xl tracking-[-0.04em]">{APP_CONFIG.pricing.proBolivarsLabel}</strong>
                <span className="text-[10px] text-[var(--muted-soft)]">Equivalente a {APP_CONFIG.pricing.proMonthlyLabel} USD</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
            <PaymentDetail
              icon={Building2}
              label="Banco"
              value={PAYMENT_CONFIG.mobilePayment.bank}
              copied={copiedField === "bank"}
              onCopy={() => copyPaymentDetail("bank", PAYMENT_CONFIG.mobilePayment.bank)}
            />
            <PaymentDetail
              icon={Phone}
              label="Teléfono"
              value={PAYMENT_CONFIG.mobilePayment.phone}
              copied={copiedField === "phone"}
              onCopy={() => copyPaymentDetail("phone", PAYMENT_CONFIG.mobilePayment.phone)}
            />
            <PaymentDetail
              icon={Hash}
              label="Cédula"
              value={PAYMENT_CONFIG.mobilePayment.identityDocument}
              copied={copiedField === "identity"}
              onCopy={() => copyPaymentDetail("identity", PAYMENT_CONFIG.mobilePayment.identityDocument)}
            />
          </div>

          {!paymentsReady && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] p-3 text-xs leading-5 text-[var(--muted)]" role="alert">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
              Falta aplicar la migración de pagos Pro en Supabase para poder reportar referencias.
            </p>
          )}

          {paymentStatus && paymentStatus !== "cancelled" && (
            <PaymentStatusCard
              status={paymentStatus}
              submittedAt={payment?.submittedAt ?? null}
              reviewNote={payment?.reviewNote ?? null}
            />
          )}

          {paymentStatus !== "approved" && <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Teléfono del pagador
              <input
                type="tel"
                value={payerPhone}
                onChange={(event) => setPayerPhone(event.target.value)}
                placeholder="04XX-XXX-XXXX"
                autoComplete="tel"
                className="auth-field mt-2 px-4"
              />
            </label>
            <label className="block text-sm font-semibold">
              Referencia del pago
              <input
                type="text"
                inputMode="numeric"
                value={reference}
                onChange={(event) => setReference(event.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="Últimos números"
                autoComplete="off"
                className="auth-field mt-2 px-4"
              />
            </label>
          </div>}

          {paymentStatus !== "approved" && <button
            type="button"
            onClick={preparePaymentReport}
            disabled={isReporting || !paymentsReady}
            className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d4aff,#2563eb)] px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {isReporting ? "Registrando pago…" : paymentStatus === "pending" ? "Actualizar referencia" : "Reportar Pago Móvil"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>}

          {feedback && (
            <p className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-3 text-xs leading-5 text-[var(--muted)]" role="status" aria-live="polite">
              {feedback}
            </p>
          )}

          <div className="mt-7 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
            {(paymentStatus === "pending" || paymentStatus === "approved") && (
              <form action={continueAfterPayment}>
                <CheckoutActionButton pendingLabel="Continuando…">
                  {paymentStatus === "approved" ? "Continuar con Pro" : "Continuar mientras verificamos"}
                </CheckoutActionButton>
              </form>
            )}
            {paymentStatus !== "approved" && (
              <form action={continueWithFree}>
                <CheckoutActionButton pendingLabel="Cambiando a Free…">
                  {paymentStatus === "pending" ? "Cancelar solicitud y usar Free" : "Continuar con Free"}
                </CheckoutActionButton>
              </form>
            )}
            <form action={returnToLogin}>
              <CheckoutActionButton pendingLabel="Cerrando sesión…" subtle>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver a iniciar sesión
              </CheckoutActionButton>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--muted-soft)]">
            <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
            Pro se activará únicamente después de verificar el pago.
          </div>
        </section>
      </main>
    </div>
  );
}

function PaymentStatusCard({
  status,
  submittedAt,
  reviewNote,
}: {
  status: "pending" | "approved" | "rejected";
  submittedAt: string | null;
  reviewNote: string | null;
}) {
  const config = status === "approved"
    ? {
        icon: BadgeCheck,
        title: "DiLink Pro está activo",
        description: "El pago fue verificado y las funciones Pro ya están disponibles.",
        className: "border-emerald-400/25 bg-emerald-400/[0.08]",
        iconClassName: "text-emerald-500",
      }
    : status === "rejected"
      ? {
          icon: TriangleAlert,
          title: "Necesitamos revisar otro pago",
          description: reviewNote || "No pudimos verificar la referencia. Revisa los datos y vuelve a reportarla.",
          className: "border-rose-400/25 bg-rose-400/[0.08]",
          iconClassName: "text-rose-500",
        }
      : {
          icon: Clock3,
          title: "Pago en revisión",
          description: "Tu referencia fue recibida. Puedes continuar creando tu página mientras la verificamos.",
          className: "border-amber-400/25 bg-amber-400/[0.08]",
          iconClassName: "text-amber-500",
        };
  const Icon = config.icon;

  return (
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${config.className}`} role="status">
      <Icon className={`mt-0.5 size-5 shrink-0 ${config.iconClassName}`} aria-hidden="true" />
      <div>
        <strong className="block text-sm">{config.title}</strong>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{config.description}</p>
        {submittedAt && status === "pending" && (
          <span className="mt-2 block text-[10px] text-[var(--muted-soft)]">
            Reportado el {formatPaymentDate(submittedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatPaymentDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(new Date(value));
}

function CheckoutActionButton({
  children,
  pendingLabel,
  subtle = false,
}: {
  children: ReactNode;
  pendingLabel: string;
  subtle?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${
        subtle
          ? "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          : "border border-[var(--border-strong)] bg-[var(--surface-soft)] hover:bg-[var(--subtle-hover)]"
      }`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function PaymentDetail({
  icon: Icon,
  label,
  value,
  copied,
  onCopy,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="min-w-0">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
          <Icon className="size-3.5 text-violet-500" aria-hidden="true" />
          {label}
        </span>
        <strong className="mt-2 block break-words text-xs">{value}</strong>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-[10px] font-bold text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        aria-label={`Copiar ${label.toLowerCase()}`}
      >
        {copied ? <CheckCheck className="size-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

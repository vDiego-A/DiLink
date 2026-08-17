import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CheckCircle2, Clock3, Crown, ExternalLink, Link2, Palette, Plus, ShieldCheck, TriangleAlert } from "lucide-react";
import { signOut } from "@/app/dashboard/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getMetadataString, getPostAuthRoute } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getAnalyticsOverview } from "@/lib/supabase/analytics-data";
import { getAdminPaymentRequests, getMyPaymentStatus } from "@/lib/supabase/payment-data";
import { getOwnedProfileData } from "@/lib/supabase/profile-data";

export const metadata: Metadata = {
  title: "Mi dashboard",
  description: "Administra tu página y tu plan en DiLink.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { isConfigured, claims } = await getServerAuthState();

  if (!isConfigured) {
    redirect(`${APP_ROUTES.login}?authError=configuration`);
  }

  if (!claims) redirect(APP_ROUTES.login);

  const authMetadata = claims.user_metadata;
  if (authMetadata?.onboarding_completed !== true) {
    redirect(getPostAuthRoute(authMetadata));
  }

  const query = await searchParams;
  const logoutError = Array.isArray(query.logoutError)
    ? query.logoutError[0]
    : query.logoutError;
  const email = typeof claims.email === "string" ? claims.email : "Usuario autenticado";
  const displayName = getMetadataString(authMetadata, "display_name") || "Bienvenido";
  const username = getMetadataString(authMetadata, "requested_username");
  const profileData = await getOwnedProfileData(claims.sub, authMetadata);
  const [paymentData, adminData, analyticsOverview] = await Promise.all([
    getMyPaymentStatus(claims.sub),
    getAdminPaymentRequests(),
    profileData.persistenceReady
      ? getAnalyticsOverview(profileData.profile.id)
      : Promise.resolve({ ready: false, totalViews: 0, totalClicks: 0, periodViews: 0, periodClicks: 0 }),
  ]);
  const publicUsername = profileData.profile.username || username;
  const activeLinks = profileData.links.filter((link) => link.is_active).length;
  const pendingAdminPayments = adminData.isAdmin
    ? adminData.payments.filter((payment) => payment.status === "pending").length
    : 0;
  const paymentStatus = paymentData.payment?.status;
  const planCard = profileData.profile.plan === "pro"
    ? {
        title: "DiLink Pro activo",
        description: "Enlaces ilimitados, personalización completa y sin branding.",
        icon: Crown,
        iconClassName: "bg-violet-500/15 text-violet-500",
      }
    : paymentStatus === "pending"
      ? {
          title: "Tu pago Pro está en revisión",
          description: "Recibimos la referencia. Puedes seguir editando tu página Free mientras la verificamos.",
          icon: Clock3,
          iconClassName: "bg-amber-500/10 text-amber-500",
        }
      : paymentStatus === "rejected"
        ? {
            title: "No pudimos verificar el pago",
            description: paymentData.payment?.review_note || "Revisa la referencia y vuelve a reportarla desde el checkout.",
            icon: TriangleAlert,
            iconClassName: "bg-rose-500/10 text-rose-500",
          }
        : {
            title: "Estás usando DiLink Free",
            description: "Mejora a Pro para desbloquear temas, fuentes, fondos y enlaces ilimitados.",
            icon: Crown,
            iconClassName: "bg-[var(--surface-soft)] text-[var(--muted)]",
          };
  const PlanIcon = planCard.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 pb-12 pt-24 text-[var(--foreground)] sm:px-6 sm:pt-28">
      <div className="auth-page-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-8 size-[34rem] -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-[130px]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-text)] sm:inline">{profileData.profile.plan}</span>
            {adminData.isAdmin && (
              <Link href={APP_ROUTES.adminPayments} className="hidden h-9 items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-3 text-xs font-semibold text-violet-500 sm:inline-flex">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Verificar pagos
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--success-text)]">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Tu espacio está listo
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Hola, {displayName}.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {publicUsername ? `Tu página es DiLink/${publicUsername}.` : `Sesión iniciada como ${email}.`}
            </p>
          </div>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </section>

        {logoutError && (
          <p className="mt-6 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] p-3 text-xs text-[var(--muted)]">
            No pudimos cerrar la sesión. Inténtalo nuevamente.
          </p>
        )}

        {adminData.isAdmin && (
          <Link href={APP_ROUTES.adminPayments} className="mt-7 flex flex-col gap-4 rounded-2xl border border-violet-400/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(37,99,235,0.05),var(--surface))] p-5 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-500">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm">Panel de verificación de pagos</strong>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Revisa las referencias reportadas y activa DiLink Pro.</span>
              </span>
            </span>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {pendingAdminPayments} {pendingAdminPayments === 1 ? "pago pendiente" : "pagos pendientes"}
            </span>
          </Link>
        )}

        <section className="mt-9 grid gap-4 md:grid-cols-3">
          <DashboardCard href={APP_ROUTES.editor} icon={Link2} title="Enlaces" description="Agrega redes, sitios y contenido a tu página." value={`${activeLinks} ${activeLinks === 1 ? "enlace" : "enlaces"}`} />
          <DashboardCard href={APP_ROUTES.editor} icon={Palette} title="Diseño" description="Personaliza el tema, la paleta y los botones." value={profileData.profile.theme} />
          <DashboardCard
            href={APP_ROUTES.analytics}
            icon={BarChart3}
            title="Analytics"
            description={analyticsOverview.ready ? `${analyticsOverview.totalClicks} clics registrados en tus enlaces.` : "Prepara la migración para empezar a medir visitas."}
            value={analyticsOverview.ready ? `${analyticsOverview.totalViews} visitas` : "Configurar"}
          />
        </section>

        <section className={`mt-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${profileData.profile.plan === "pro" ? "border-violet-400/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(37,99,235,0.05),var(--surface))]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
          <div className="flex items-start gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${planCard.iconClassName}`}>
              <PlanIcon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <strong className="text-sm">{planCard.title}</strong>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{planCard.description}</p>
            </div>
          </div>
          {profileData.profile.plan === "free" && (
            <Link href={APP_ROUTES.checkout} className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20">
              {paymentStatus === "pending" ? "Ver estado" : paymentStatus === "rejected" ? "Corregir pago" : "Mejorar a Pro"}
            </Link>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-9">
          <div className="mx-auto max-w-lg py-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-500">
              <Link2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{activeLinks === 0 ? "Tu página está un poco vacía." : "Tu DiLink está tomando forma."}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{activeLinks === 0 ? "Agrega tu primer enlace y empieza a construir tu perfil." : "Edita el contenido, cambia el diseño y publica cuando esté listo."}</p>
            <Link href={APP_ROUTES.editor} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:-translate-y-0.5">
              <Plus className="size-4" aria-hidden="true" />
              {activeLinks === 0 ? "Agregar mi primer enlace" : "Abrir editor"}
            </Link>
            {profileData.profile.is_published && (
              <Link href={`/${publicUsername}`} target="_blank" className="mt-3 inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
                Abrir mi página <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function DashboardCard({
  href,
  icon: Icon,
  title,
  description,
  value,
}: {
  href: string;
  icon: typeof Link2;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold text-[var(--muted-soft)]">{value}</span>
      </div>
      <h2 className="mt-5 text-lg font-semibold transition-colors group-hover:text-violet-500">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
    </Link>
  );
}

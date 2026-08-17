import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  ChartNoAxesColumnIncreasing,
  Crown,
  Eye,
  Link2,
  LockKeyhole,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_ROUTES } from "@/lib/config";
import type { OwnedAnalyticsData } from "@/lib/supabase/analytics-data";
import type { ProfileRow } from "@/types/database";

export function AnalyticsDashboard({ profile, analytics }: { profile: ProfileRow; analytics: OwnedAnalyticsData }) {
  const isPro = profile.plan === "pro";
  const clickRate = analytics.totalViews > 0 ? (analytics.totalClicks / analytics.totalViews) * 100 : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 pb-14 pt-24 text-[var(--foreground)] sm:px-6 sm:pt-28">
      <div className="auth-page-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-10 size-[32rem] -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-[130px]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:inline-flex ${isPro ? "bg-violet-500/12 text-violet-500" : "border border-[var(--border)] text-[var(--muted)]"}`}>
              {isPro && <Crown className="size-3.5" aria-hidden="true" />}
              {profile.plan}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={APP_ROUTES.dashboard} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
              <ArrowLeft className="size-4" aria-hidden="true" /> Dashboard
            </Link>
            <p className="mt-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">
              <BarChart3 className="size-4" aria-hidden="true" /> Analytics
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Entiende tu alcance.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Consulta cuántas personas visitan tu DiLink y qué enlaces generan más interés.</p>
          </div>
          {profile.is_published && (
            <Link href={`/${profile.username}`} target="_blank" className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold">
              Abrir mi página <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {!analytics.ready && (
          <section className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-5">
            <strong className="text-sm">Analytics está listo en la aplicación.</strong>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Aplica la migración más reciente en Supabase para comenzar a registrar visitas y clics.</p>
          </section>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de Analytics">
          <MetricCard icon={Eye} label="Visitas totales" value={formatNumber(analytics.totalViews)} detail={`${formatNumber(analytics.periodViews)} últimos 30 días`} />
          <MetricCard icon={MousePointerClick} label="Clics totales" value={formatNumber(analytics.totalClicks)} detail={`${formatNumber(analytics.periodClicks)} últimos 30 días`} />
          <MetricCard icon={ChartNoAxesColumnIncreasing} label="Tasa de clics" value={`${clickRate.toFixed(1)}%`} detail="Clics respecto a visitas" />
          <MetricCard icon={Link2} label="Página" value={`@${profile.username}`} detail={profile.is_published ? "Publicada y recopilando datos" : "Publica para comenzar"} compact />
        </section>

        {isPro ? (
          analytics.advancedReady ? (
            <ProAnalytics analytics={analytics} />
          ) : analytics.ready ? (
            <section className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-5">
              <strong className="text-sm">No pudimos cargar el detalle Pro.</strong>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Comprueba que aplicaste toda la migración de Analytics y vuelve a cargar la página.</p>
            </section>
          ) : null
        ) : (
          <FreeAnalyticsUpgrade />
        )}
      </main>
    </div>
  );
}

function ProAnalytics({ analytics }: { analytics: OwnedAnalyticsData }) {
  const maximumActivity = Math.max(1, ...analytics.daily.flatMap((day) => [day.views, day.clicks]));
  const maximumLinkClicks = Math.max(1, ...analytics.links.map((link) => link.clicks));

  return (
    <div className="mt-6 grid gap-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Actividad diaria</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Últimos 30 días</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-semibold text-[var(--muted)]">
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-violet-500" />Visitas</span>
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-cyan-400" />Clics</span>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto pb-2">
          <div className="flex h-64 min-w-[760px] items-end gap-2 border-b border-[var(--border)] px-1 pt-4">
            {analytics.daily.map((day, index) => (
              <div key={day.day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${formatDay(day.day)}: ${day.views} visitas, ${day.clicks} clics`}>
                <div className="flex h-[210px] w-full items-end justify-center gap-1">
                  <span className="w-[42%] min-w-1 rounded-t bg-violet-500 transition-opacity group-hover:opacity-80" style={{ height: barHeight(day.views, maximumActivity) }} />
                  <span className="w-[42%] min-w-1 rounded-t bg-cyan-400 transition-opacity group-hover:opacity-80" style={{ height: barHeight(day.clicks, maximumActivity) }} />
                </div>
                <span className="h-4 text-[8px] text-[var(--muted-soft)]">{index % 5 === 0 || index === analytics.daily.length - 1 ? shortDay(day.day) : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Rendimiento por enlace</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Qué contenido recibe más clics</h2>
        <div className="mt-6 grid gap-4">
          {analytics.links.length > 0 ? analytics.links.map((link, index) => (
            <article key={link.linkId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-sm font-semibold"><span className="mr-2 text-xs text-[var(--muted-soft)]">{String(index + 1).padStart(2, "0")}</span>{link.title}</span>
                <strong className="shrink-0 text-sm">{formatNumber(link.clicks)} <span className="text-[10px] font-medium text-[var(--muted)]">clics</span></strong>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#2563EB,#22D3EE)]" style={{ width: `${(link.clicks / maximumLinkClicks) * 100}%` }} />
              </div>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-7 text-center text-sm text-[var(--muted)]">Agrega enlaces para empezar a medir sus clics.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function FreeAnalyticsUpgrade() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-violet-400/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.13),rgba(37,99,235,0.06),var(--surface))] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-violet-500/15 blur-[70px]" aria-hidden="true" />
      <div className="relative grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500"><LockKeyhole className="size-3.5" aria-hidden="true" />Detalle Pro</span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">Descubre qué funciona mejor.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Free conserva tus totales. Con Pro desbloqueas la gráfica de 30 días y los clics de cada enlace; los eventos que recopiles ahora estarán disponibles cuando actualices.</p>
          <Link href={APP_ROUTES.checkout} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20">
            <Crown className="size-4" aria-hidden="true" /> Activar Analytics Pro
          </Link>
        </div>
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0c0b17] p-5 text-white shadow-2xl">
          <span className="flex items-center justify-between text-xs font-semibold"><span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-violet-300" aria-hidden="true" />Incluido con Pro</span><Crown className="size-4 text-amber-300" aria-hidden="true" /></span>
          <span className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-zinc-300">Actividad diaria durante 30 días</span>
          <span className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-zinc-300">Ranking real de enlaces por clics</span>
          <span className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-zinc-300">Historial acumulado desde tu primera visita</span>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail, compact = false }: { icon: typeof Eye; label: string; value: string; detail: string; compact?: boolean }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
      <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="size-4" aria-hidden="true" /></span>
      <p className="mt-5 text-xs font-semibold text-[var(--muted)]">{label}</p>
      <strong className={`mt-2 block truncate font-semibold tracking-[-0.04em] ${compact ? "text-xl" : "text-3xl"}`} title={value}>{value}</strong>
      <p className="mt-2 text-[10px] leading-4 text-[var(--muted-soft)]">{detail}</p>
    </article>
  );
}

function barHeight(value: number, maximum: number) {
  if (value === 0) return "0%";
  return `${Math.max(4, (value / maximum) * 100)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-VE").format(value);
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00Z`));
}

function shortDay(value: string) {
  return new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00Z`)).replace(".", "");
}

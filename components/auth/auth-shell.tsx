import type { ReactNode } from "react";
import { BarChart3, Check, Sparkles } from "lucide-react";
import { ProfileMockup } from "@/components/marketing/profile-mockup";
import { Logo } from "@/components/ui/logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  centered?: boolean;
};

export function AuthShell({ eyebrow, title, description, children, centered = false }: AuthShellProps) {
  if (centered) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="auth-page-grid absolute inset-0 opacity-60" />
          <div className="absolute left-1/2 top-[12%] size-[30rem] -translate-x-1/2 rounded-full bg-violet-500/[0.1] blur-[120px]" />
          <div className="absolute bottom-[-12rem] right-[8%] size-96 rounded-full bg-blue-500/[0.06] blur-[110px]" />
        </div>

        <section className="relative w-full max-w-[550px] rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-8 shadow-[var(--auth-card-shadow)] sm:px-10 sm:py-10">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="mx-auto mt-7 max-w-[450px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">{eyebrow}</p>
            <h1 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.5rem]">
              {title}
            </h1>
            <p className="mt-3 text-pretty text-sm leading-6 text-[var(--muted)] sm:text-base">
              {description}
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-[450px]">{children}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,0.98fr)]">
      <section className="relative flex items-center px-4 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:px-12 xl:px-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 top-20 size-[28rem] rounded-full bg-violet-500/[0.07] blur-[110px]" />
          <div className="absolute bottom-0 right-0 size-80 rounded-full bg-blue-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[470px]">
          <div className="mb-8">
            <Logo />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--accent-text)]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="mt-7 text-balance text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[var(--foreground)] sm:text-[3rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden border-l border-white/10 bg-[#070711] p-10 text-white lg:flex lg:items-center lg:justify-center xl:p-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="auth-visual-grid absolute inset-0 opacity-70" />
          <div className="absolute -right-20 top-[8%] size-96 rounded-full bg-violet-600/25 blur-[120px]" />
          <div className="absolute -bottom-20 left-[5%] size-80 rounded-full bg-cyan-500/15 blur-[110px]" />
        </div>

        <div className="relative grid w-full max-w-[580px] grid-cols-[minmax(0,1fr)_minmax(230px,0.78fr)] items-center gap-8">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Tu espacio, a tu manera</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.03] tracking-[-0.05em] text-white xl:text-[3.1rem]">
              Convierte tus enlaces en una experiencia.
            </h2>
            <ul className="mt-7 space-y-3">
              {["Publica en minutos", "Personaliza cada detalle", "Comparte un único link"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[270px] rotate-[2deg]">
            <div className="absolute inset-5 rounded-[2.5rem] bg-violet-500/30 blur-[65px]" aria-hidden="true" />
            <ProfileMockup theme="aurora" compact className="relative" />
            <div className="absolute -bottom-9 -left-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11111d]/90 p-3.5 shadow-2xl backdrop-blur-xl">
              <span className="grid size-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <BarChart3 className="size-4" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm text-white">+2.4K</strong>
                <span className="block text-[10px] text-zinc-400">visitas este mes</span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

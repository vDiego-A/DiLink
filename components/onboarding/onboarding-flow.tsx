"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  Globe2,
  LoaderCircle,
  Mic2,
  Palette,
  Rocket,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_NAME, APP_ROUTES } from "@/lib/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OnboardingFlowProps = {
  initialName: string;
  initialUsername: string;
  email: string;
  selectedPlan: "free" | "pro";
};

const objectives = [
  { id: "creator", label: "Creador", description: "Contenido, redes y comunidad.", icon: Sparkles },
  { id: "professional", label: "Profesional", description: "Marca personal y experiencia.", icon: BriefcaseBusiness },
  { id: "business", label: "Negocio", description: "Servicios, contacto y ventas.", icon: Store },
  { id: "artist", label: "Artista", description: "Proyectos, música y portafolio.", icon: Mic2 },
] as const;

const themes = [
  { id: "neon", name: "Neon", colors: ["#7c3aed", "#2563eb", "#22d3ee"] },
  { id: "minimal", name: "Minimal", colors: ["#18181b", "#52525b", "#fafafa"] },
  { id: "aurora", name: "Aurora", colors: ["#8b5cf6", "#22d3ee", "#0f172a"] },
] as const;

export function OnboardingFlow({ initialName, initialUsername, email, selectedPlan }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [objective, setObjective] = useState<(typeof objectives)[number]["id"] | "">("");
  const [theme, setTheme] = useState<(typeof themes)[number]["id"]>("neon");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const goForward = () => {
    const validationError = validateStep(step, { displayName, username, objective, linkUrl });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, 4));
  };

  const finishOnboarding = async () => {
    const validationError = validateStep(4, { displayName, username, objective, linkUrl });
    if (validationError) {
      setError(validationError);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("No pudimos conectar con Supabase en este entorno.");
      return;
    }

    setIsSaving(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName.trim(),
        requested_username: normalizeUsername(username),
        objective,
        initial_theme: theme,
        first_link_url: linkUrl.trim(),
        selected_plan: selectedPlan,
        onboarding_completed: true,
      },
    });

    if (updateError) {
      setIsSaving(false);
      setError("No pudimos guardar tus datos. Inténtalo nuevamente.");
      return;
    }

    await supabase.auth.refreshSession();
    router.replace(APP_ROUTES.dashboard);
    router.refresh();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 pb-12 pt-24 text-[var(--foreground)] sm:px-6 sm:pt-28">
      <div className="auth-page-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-10 size-[34rem] -translate-x-1/2 rounded-full bg-violet-500/[0.09] blur-[130px]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--muted)] sm:inline">{email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">Primeros pasos</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Construyamos tu página.</h1>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
            {step} de 4
          </span>
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2" aria-label={`Paso ${step} de 4`}>
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-1.5 rounded-full transition-colors ${item <= step ? "bg-violet-500" : "bg-[var(--border)]"}`}
            />
          ))}
        </div>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--auth-card-shadow)] sm:p-8">
          {step === 1 && (
            <div>
              <StepHeading title="Tu identidad" description="Así empezará a reconocerte tu audiencia." />
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <OnboardingField
                  id="displayName"
                  label="Nombre público"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Diego Tech"
                  icon={UserRound}
                />
                <OnboardingField
                  id="username"
                  label="Nombre de tu página"
                  value={username}
                  onChange={(value) => setUsername(normalizeUsername(value))}
                  placeholder="diego"
                  prefix={`${APP_NAME}/`}
                  icon={Globe2}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-[var(--muted-soft)]">
                En esta versión prepararemos el nombre; la disponibilidad única se confirmará al crear tu perfil.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeading title="¿Para qué usarás DiLink?" description="Esto nos ayudará a preparar una experiencia relevante." />
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {objectives.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setObjective(id);
                      setError("");
                    }}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      objective === id
                        ? "border-violet-500/50 bg-violet-500/[0.09]"
                        : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <strong className="block text-sm">{label}</strong>
                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span>
                    </span>
                    {objective === id && <Check className="ml-auto size-4 text-violet-500" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeading title="Elige un punto de partida" description="Podrás cambiar el tema y personalizarlo más adelante." />
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      theme === item.id
                        ? "border-violet-500/60 bg-violet-500/[0.08]"
                        : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span
                      className="block aspect-[4/5] rounded-xl border border-white/10"
                      style={{ background: `linear-gradient(145deg, ${item.colors.join(", ")})` }}
                    />
                    <span className="mt-3 flex items-center justify-between text-sm font-semibold">
                      {item.name}
                      {theme === item.id && <Check className="size-4 text-violet-500" aria-hidden="true" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeading title="Agrega tu primer enlace" description="Es opcional. Podrás administrar todos tus enlaces desde el editor." />
              <div className="mt-7">
                <OnboardingField
                  id="firstLink"
                  label="Sitio web o red social"
                  value={linkUrl}
                  onChange={setLinkUrl}
                  placeholder="https://instagram.com/tuusuario"
                  icon={Rocket}
                  type="url"
                />
              </div>
              <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Palette className="size-4 text-violet-500" aria-hidden="true" />
                  Tu configuración inicial está lista
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {selectedPlan === "pro"
                    ? "Entrarás al dashboard con Free mientras verificamos el pago. Pro se activará al aprobarlo."
                    : "Entrarás al dashboard con el plan Free. Podrás conocer Pro cuando lo necesites."}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] p-3 text-xs text-[var(--muted)]" role="alert">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step === 1 ? (
              <Link href={APP_ROUTES.home} className="inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver al inicio
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStep((current) => Math.max(current - 1, 1));
                  setError("");
                }}
                className="inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Atrás
              </button>
            )}

            {step < 4 ? (
              <button type="button" onClick={goForward} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                Continuar
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={isSaving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-65"
              >
                {isSaving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                {isSaving ? "Preparando tu espacio…" : "Ir a mi dashboard"}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-[-0.035em]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}

function OnboardingField({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  prefix,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: typeof UserRound;
  prefix?: string;
  type?: "text" | "url";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-500" aria-hidden="true" />
        {prefix && <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold">{prefix}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={id === "displayName" ? "name" : "off"}
          className={`auth-field pr-4 ${prefix ? "pl-[6.35rem]" : "pl-11"}`}
        />
      </div>
    </div>
  );
}

function validateStep(
  step: number,
  values: { displayName: string; username: string; objective: string; linkUrl: string },
) {
  if (step === 1) {
    if (values.displayName.trim().length < 2) return "Escribe un nombre público de al menos 2 caracteres.";
    const normalizedUsername = normalizeUsername(values.username);
    if (normalizedUsername.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedUsername)) {
      return "El nombre de página debe tener al menos 3 caracteres y usar letras, números o guiones.";
    }
  }

  if (step === 2 && !values.objective) return "Selecciona el objetivo principal de tu página.";

  if (step === 4 && values.linkUrl.trim()) {
    try {
      const url = new URL(values.linkUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("invalid");
    } catch {
      return "Escribe una URL válida que comience con http:// o https://.";
    }
  }

  return "";
}

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 30);
}

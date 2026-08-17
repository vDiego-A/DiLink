"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { getPostAuthRoute } from "@/lib/auth-flow";
import { APP_CONFIG, APP_NAME, APP_ROUTES } from "@/lib/config";
import type { PlanId } from "@/lib/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";
type FieldName = "username" | "name" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;
type Feedback = {
  type: "success" | "error";
  message: string;
};

type AuthFormProps = {
  mode: AuthMode;
  defaultPlan?: PlanId;
  collectUsername?: boolean;
  initialStatus?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function AuthForm({
  mode,
  defaultPlan = "free",
  collectUsername = false,
  initialStatus = "",
}: AuthFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialStatus ? { type: "error", message: initialStatus } : null,
  );
  const [username, setUsername] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(defaultPlan);
  const [pendingAction, setPendingAction] = useState<"email" | "google" | null>(null);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot-password";
  const isResetPassword = mode === "reset-password";
  const isPending = pendingAction !== null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateAuthForm(mode, formData, collectUsername);

    setErrors(nextErrors);
    setFeedback(null);

    if (Object.keys(nextErrors).length > 0) return;

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFeedback({
        type: "error",
        message: "Falta configurar la conexión de Supabase en este entorno.",
      });
      return;
    }

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setPendingAction("email");

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          reportDevelopmentError(error.message);
          setFeedback({ type: "error", message: getFriendlyAuthError(error.message, mode) });
          return;
        }

        router.replace(getPostAuthRoute(data.user.user_metadata));
        router.refresh();
        return;
      }

      if (isSignup) {
        const name = String(formData.get("name") ?? "").trim();
        const callbackUrl = buildCallbackUrl(APP_ROUTES.onboarding);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              display_name: name,
              requested_username: username.trim(),
              selected_plan: selectedPlan,
              onboarding_completed: false,
            },
          },
        });

        if (error) {
          reportDevelopmentError(error.message);
          setFeedback({ type: "error", message: getFriendlyAuthError(error.message, mode) });
          return;
        }

        if (data.session) {
          router.replace(getPostAuthRoute(data.user?.user_metadata));
          router.refresh();
          return;
        }

        setFeedback({
          type: "success",
          message:
            selectedPlan === "pro"
              ? "Cuenta creada. Confirma tu correo para continuar al pago seguro de Pro."
              : "Cuenta creada. Revisa tu correo para confirmar tu cuenta y continuar.",
        });
        return;
      }

      if (isForgotPassword) {
        const callbackUrl = buildCallbackUrl(APP_ROUTES.resetPassword);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl,
        });

        if (error) reportDevelopmentError(error.message);

        setFeedback({
          type: "success",
          message:
            "Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña.",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        reportDevelopmentError(error.message);
        setFeedback({ type: "error", message: getFriendlyAuthError(error.message, mode) });
        return;
      }

      setFeedback({
        type: "success",
        message: "Contraseña actualizada correctamente. Entrando a tu cuenta…",
      });
      window.setTimeout(() => {
        router.replace(APP_ROUTES.dashboard);
        router.refresh();
      }, 900);
    } catch {
      setFeedback({
        type: "error",
        message: "No pudimos completar la solicitud. Inténtalo nuevamente.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFeedback({
        type: "error",
        message: "Falta configurar la conexión de Supabase en este entorno.",
      });
      return;
    }

    setPendingAction("google");
    setFeedback(null);

    try {
      const nextRoute = isSignup
        ? selectedPlan === "pro"
          ? APP_ROUTES.checkout
          : APP_ROUTES.onboarding
        : APP_ROUTES.dashboard;
      const callbackUrl = buildCallbackUrl(nextRoute);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        reportDevelopmentError(error.message);
        setFeedback({
          type: "error",
          message: getFriendlyGoogleError(error.message),
        });
        setPendingAction(null);
        return;
      }

      if (!data.url) {
        setFeedback({
          type: "error",
          message: "No pudimos abrir Google. Inténtalo nuevamente.",
        });
        setPendingAction(null);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setPendingAction(null);
      setFeedback({
        type: "error",
        message: "No pudimos conectar con Google. Inténtalo nuevamente.",
      });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {isSignup && <PlanSelector value={selectedPlan} onChange={setSelectedPlan} />}

      {isSignup && collectUsername && (
        <UsernameField
          value={username}
          onChange={(value) => {
            setUsername(sanitizeUsernameInput(value));
            setErrors((current) => ({ ...current, username: undefined }));
          }}
          error={errors.username}
        />
      )}

      {isSignup && (
        <AuthField
          id="name"
          name="name"
          label="Nombre"
          placeholder="¿Cómo te llamas?"
          autoComplete="name"
          icon={UserRound}
          error={errors.name}
        />
      )}

      {!isResetPassword && (
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          error={errors.email}
        />
      )}

      {!isForgotPassword && (
        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
          placeholder={isSignup || isResetPassword ? "Mínimo 8 caracteres" : "Tu contraseña"}
          autoComplete={isSignup || isResetPassword ? "new-password" : "current-password"}
          error={errors.password}
        />
      )}

      {(isSignup || isResetPassword) && (
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
      )}

      {isLogin && (
        <div className="flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-[var(--muted)]">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-[var(--border-strong)] accent-violet-600"
            />
            Recordarme
          </label>
          <Link
            href={APP_ROUTES.forgotPassword}
            className="font-semibold text-violet-600 transition-colors hover:text-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}

      {isSignup && (
        <p className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
          <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--success-text)]" aria-hidden="true" />
          Al crear tu cuenta aceptas usar DiLink de forma responsable y mantener tus datos actualizados.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full border border-violet-300/20 bg-[linear-gradient(135deg,#8b5cf6_0%,#6d4aff_48%,#2563eb_100%)] px-6 text-sm font-semibold text-white shadow-[0_14px_42px_rgba(91,65,255,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(91,65,255,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-wait disabled:opacity-65 disabled:hover:translate-y-0"
      >
        {pendingAction === "email" && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {getSubmitLabel(mode, pendingAction === "email")}
        {pendingAction !== "email" && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        )}
      </button>

      {(isLogin || isSignup) && (
        <>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-soft)]">
              o continúa con
            </span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--subtle-hover)] hover:shadow-[var(--card-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-wait disabled:opacity-65"
          >
            {pendingAction === "google" ? (
              <LoaderCircle className="size-4 animate-spin text-violet-500" aria-hidden="true" />
            ) : (
              <span
                className="grid size-6 place-items-center rounded-full bg-white text-[15px] font-bold shadow-[0_1px_5px_rgba(0,0,0,0.15)]"
                aria-hidden="true"
              >
                <span className="google-letter">G</span>
              </span>
            )}
            {pendingAction === "google" ? "Abriendo Google…" : "Continuar con Google"}
          </button>
        </>
      )}

      {feedback && (
        <p
          className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 text-[var(--muted)] ${
            feedback.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/[0.08]"
              : "border-rose-400/25 bg-rose-400/[0.08]"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-rose-500" aria-hidden="true" />
          )}
          {feedback.message}
        </p>
      )}

      <AuthAlternative mode={mode} />
    </form>
  );
}

function UsernameField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = "username-error";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor="username">
        Nombre de tu página
      </label>
      <div className="relative">
        <Globe2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-500" aria-hidden="true" />
        <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--foreground)]">
          {APP_NAME}/
        </span>
        <input
          id="username"
          name="username"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="mi-pagina"
          autoComplete="off"
          spellCheck={false}
          maxLength={30}
          className="auth-field pl-[6.35rem] pr-4"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : "username-help"}
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-500">
          {error}
        </p>
      ) : (
        <p id="username-help" className="mt-1.5 text-xs leading-5 text-[var(--muted-soft)]">
          Usa letras minúsculas, números y guiones. Entre 3 y 30 caracteres.
        </p>
      )}
    </div>
  );
}

function PlanSelector({
  value,
  onChange,
}: {
  value: PlanId;
  onChange: (plan: PlanId) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-[var(--foreground)]">Elige cómo quieres comenzar</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-1.5">
        <PlanOption id="free" label="Free" detail="$0" checked={value === "free"} onChange={onChange} />
        <PlanOption
          id="pro"
          label="Pro"
          detail={`${APP_CONFIG.pricing.proMonthlyLabel} / mes`}
          checked={value === "pro"}
          onChange={onChange}
          featured
        />
      </div>
    </fieldset>
  );
}

function PlanOption({
  id,
  label,
  detail,
  checked,
  onChange,
  featured = false,
}: {
  id: PlanId;
  label: string;
  detail: string;
  checked: boolean;
  onChange: (plan: PlanId) => void;
  featured?: boolean;
}) {
  return (
    <label className="group relative cursor-pointer">
      <input
        className="peer sr-only"
        type="radio"
        name="plan"
        value={id}
        checked={checked}
        onChange={() => onChange(id)}
      />
      <span className={`flex min-h-14 items-center justify-between rounded-xl border px-3.5 text-sm transition-all ${checked ? "border-violet-500 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(37,99,235,0.08),var(--surface))] shadow-[0_0_0_3px_rgba(124,58,237,0.15),0_12px_28px_rgba(76,29,149,0.14)]" : "border-transparent hover:border-violet-400/30 hover:bg-[var(--surface)]"}`}>
        <span>
          <strong className="block text-[var(--foreground)]">{label}</strong>
          <span className="text-[11px] text-[var(--muted)]">{detail}</span>
        </span>
        {checked ? (
          <span className="grid size-6 place-items-center rounded-full bg-violet-600 text-white shadow-md" aria-label={`${label} seleccionado`}>
            <Check className="size-3.5" aria-hidden="true" />
          </span>
        ) : featured && (
          <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[var(--accent-text)]">
            Completo
          </span>
        )}
      </span>
    </label>
  );
}

type AuthFieldProps = {
  id: FieldName;
  name: FieldName;
  label: string;
  placeholder: string;
  type?: "text" | "email";
  autoComplete: string;
  inputMode?: "email";
  icon: typeof Mail;
  error?: string;
};

function AuthField({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  icon: Icon,
  error,
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-soft)]" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className="auth-field pl-11"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  error,
}: Omit<AuthFieldProps, "type" | "inputMode" | "icon">) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-soft)]" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="auth-field px-11"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted-soft)] transition-colors hover:bg-[var(--subtle-hover)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {isVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

function AuthAlternative({ mode }: { mode: AuthMode }) {
  if (mode === "login") {
    return (
      <p className="text-center text-sm text-[var(--muted)]">
        ¿Aún no tienes una cuenta?{" "}
        <Link className="font-semibold text-violet-600 hover:text-violet-500" href={APP_ROUTES.signup}>
          Crear una cuenta
        </Link>
      </p>
    );
  }

  if (mode === "signup") {
    return (
      <p className="text-center text-sm text-[var(--muted)]">
        ¿Ya tienes una cuenta?{" "}
        <Link className="font-semibold text-violet-600 hover:text-violet-500" href={APP_ROUTES.login}>
          Iniciar sesión
        </Link>
      </p>
    );
  }

  if (mode === "forgot-password") {
    return (
      <p className="text-center text-sm text-[var(--muted)]">
        ¿Recordaste tu contraseña?{" "}
        <Link className="font-semibold text-violet-600 hover:text-violet-500" href={APP_ROUTES.login}>
          Volver a iniciar sesión
        </Link>
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-[var(--muted)]">
      ¿Prefieres iniciar sesión?{" "}
      <Link className="font-semibold text-violet-600 hover:text-violet-500" href={APP_ROUTES.login}>
        Ir al acceso
      </Link>
    </p>
  );
}

function validateAuthForm(
  mode: AuthMode,
  formData: FormData,
  collectUsername: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  const username = String(formData.get("username") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (mode === "signup" && collectUsername && !isValidUsername(username)) {
    errors.username = getUsernameError(username);
  }

  if (mode === "signup" && name.length < 2) {
    errors.name = "Escribe un nombre de al menos 2 caracteres.";
  }

  if (mode !== "reset-password" && !emailPattern.test(email)) {
    errors.email = "Escribe un correo electrónico válido.";
  }

  if (mode !== "forgot-password" && password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if ((mode === "signup" || mode === "reset-password") && password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function sanitizeUsernameInput(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");
}

function isValidUsername(value: string) {
  return value.length >= 3 && value.length <= 30 && usernamePattern.test(value);
}

function getUsernameError(value: string) {
  if (value.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (value.length > 30) return "El nombre no puede superar los 30 caracteres.";
  return "Usa solo letras minúsculas, números y guiones entre palabras.";
}

function buildCallbackUrl(next: string) {
  const callbackUrl = new URL(APP_ROUTES.authCallback, window.location.origin);
  callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}

function getSubmitLabel(mode: AuthMode, isPending: boolean) {
  if (mode === "login") return isPending ? "Iniciando sesión…" : "Iniciar sesión";
  if (mode === "signup") return isPending ? "Creando cuenta…" : "Crear cuenta";
  if (mode === "forgot-password") {
    return isPending ? "Enviando enlace…" : "Enviar enlace";
  }
  return isPending ? "Actualizando contraseña…" : "Guardar nueva contraseña";
}

function getFriendlyAuthError(message: string, mode: AuthMode) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Correo o contraseña incorrectos.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión.";
  }

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists")
  ) {
    return "Ya existe una cuenta asociada a este correo.";
  }

  if (
    normalizedMessage.includes("password should be") ||
    normalizedMessage.includes("weak password")
  ) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }

  if (normalizedMessage.includes("same password")) {
    return "La nueva contraseña debe ser diferente de la anterior.";
  }

  if (normalizedMessage.includes("rate limit") || normalizedMessage.includes("too many")) {
    return "Has realizado demasiados intentos. Espera un momento y vuelve a probar.";
  }

  if (mode === "login") return "Correo o contraseña incorrectos.";
  return "No pudimos completar la solicitud. Inténtalo nuevamente.";
}

function getFriendlyGoogleError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("provider is not enabled") ||
    normalizedMessage.includes("unsupported provider")
  ) {
    return "El acceso con Google aún no está disponible. Revisa la configuración del proveedor.";
  }

  return "No pudimos abrir Google. Revisa la configuración e inténtalo nuevamente.";
}

function reportDevelopmentError(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Supabase Auth] ${message}`);
  }
}

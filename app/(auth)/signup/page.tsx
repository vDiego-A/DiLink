import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { FreshAccountReset } from "@/components/auth/fresh-account-reset";
import { APP_ROUTES } from "@/lib/config";
import type { PlanId } from "@/lib/plans";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Crear mi página",
  description: "Crea tu cuenta de DiLink y empieza a reunir todo lo que haces en un solo link.",
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const query = await searchParams;
  const requestedPlan = Array.isArray(query.plan) ? query.plan[0] : query.plan;
  const fresh = Array.isArray(query.fresh) ? query.fresh[0] : query.fresh;
  const defaultPlan: PlanId = requestedPlan === "pro" ? "pro" : "free";
  const { claims } = await getServerAuthState();

  if (claims && fresh !== "1") redirect(APP_ROUTES.dashboard);

  if (claims && fresh === "1") {
    return (
      <AuthShell
        eyebrow="Nuevo registro"
        title="Empecemos con una cuenta nueva."
        description="Cerraremos la sesión anterior antes de mostrar el formulario de registro."
        centered
      >
        <FreshAccountReset plan={defaultPlan} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Tu página empieza aquí"
      title="Crea tu página en DiLink."
      description="Elige el nombre deseado para tu página y crea tu cuenta. Confirmaremos su disponibilidad durante el onboarding."
      centered
    >
      <AuthForm mode="signup" defaultPlan={defaultPlan} collectUsername />
    </AuthShell>
  );
}

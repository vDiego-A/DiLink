import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de DiLink para editar y publicar tu página.",
};

const authErrorMessages: Record<string, string> = {
  configuration: "Falta configurar las variables públicas de Supabase en este entorno.",
  oauth: "Google no pudo completar el acceso. Inténtalo nuevamente.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { claims } = await getServerAuthState();
  if (claims) redirect(APP_ROUTES.dashboard);

  const query = await searchParams;
  const authError = Array.isArray(query.authError) ? query.authError[0] : query.authError;

  return (
    <AuthShell
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión en DiLink."
      description="Accede para editar tu página. Si todavía no tienes una cuenta, podrás crearla desde aquí."
      centered
    >
      <AuthForm
        mode="login"
        initialStatus={authError ? authErrorMessages[authError] : undefined}
      />
    </AuthShell>
  );
}

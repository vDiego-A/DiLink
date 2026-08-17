import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Crear nueva contraseña",
  description: "Establece una nueva contraseña para tu cuenta de DiLink.",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const { isConfigured, claims } = await getServerAuthState();

  if (isConfigured && !claims) {
    redirect(`${APP_ROUTES.forgotPassword}?authError=invalid`);
  }

  return (
    <AuthShell
      eyebrow="Protege tu cuenta"
      title="Crea una nueva contraseña."
      description="Elige una contraseña segura que no hayas utilizado anteriormente."
      centered
    >
      <AuthForm mode="reset-password" />
    </AuthShell>
  );
}

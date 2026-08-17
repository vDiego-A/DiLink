import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta de DiLink.",
};

const recoveryErrors: Record<string, string> = {
  invalid: "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const query = await searchParams;
  const authError = Array.isArray(query.authError) ? query.authError[0] : query.authError;

  return (
    <AuthShell
      eyebrow="Recupera tu acceso"
      title="Volvamos a poner tu página en tus manos."
      description="Escribe el correo de tu cuenta y recibirás las instrucciones para crear una nueva contraseña."
      centered
    >
      <AuthForm
        mode="forgot-password"
        initialStatus={authError ? recoveryErrors[authError] : undefined}
      />
    </AuthShell>
  );
}

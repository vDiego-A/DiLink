import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getMetadataString } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Configura tu página",
  description: "Completa los primeros pasos para preparar tu página en DiLink.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const { isConfigured, claims } = await getServerAuthState();

  if (!isConfigured) {
    redirect(`${APP_ROUTES.login}?authError=configuration`);
  }

  if (!claims) redirect(APP_ROUTES.login);

  const authMetadata = claims.user_metadata;
  const query = await searchParams;
  const requestedPlan = Array.isArray(query.plan) ? query.plan[0] : query.plan;
  const isReturningToFree = requestedPlan === "free";
  const isContinuingWithPro = requestedPlan === "pro";

  if (authMetadata?.onboarding_completed === true && !isReturningToFree) {
    redirect(APP_ROUTES.dashboard);
  }

  if (authMetadata?.selected_plan === "pro" && !isReturningToFree && !isContinuingWithPro) {
    redirect(APP_ROUTES.checkout);
  }

  return (
    <OnboardingFlow
      initialName={getMetadataString(authMetadata, "display_name")}
      initialUsername={getMetadataString(authMetadata, "requested_username")}
      email={typeof claims.email === "string" ? claims.email : ""}
      selectedPlan={isContinuingWithPro ? "pro" : "free"}
    />
  );
}

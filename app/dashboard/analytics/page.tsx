import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getPostAuthRoute } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getOwnedAnalyticsData } from "@/lib/supabase/analytics-data";
import { getOwnedProfileData } from "@/lib/supabase/profile-data";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Consulta las visitas y clics de tu página DiLink.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { isConfigured, claims } = await getServerAuthState();
  if (!isConfigured) redirect(`${APP_ROUTES.login}?authError=configuration`);
  if (!claims) redirect(APP_ROUTES.login);

  const authMetadata = claims.user_metadata;
  if (authMetadata?.onboarding_completed !== true) {
    redirect(getPostAuthRoute(authMetadata));
  }

  const profileData = await getOwnedProfileData(claims.sub, authMetadata);
  const analytics = profileData.persistenceReady
    ? await getOwnedAnalyticsData(profileData.profile.id, profileData.profile.plan === "pro")
    : {
        ready: false,
        advancedReady: false,
        totalViews: 0,
        totalClicks: 0,
        periodViews: 0,
        periodClicks: 0,
        daily: [],
        links: [],
      };

  return <AnalyticsDashboard profile={profileData.profile} analytics={analytics} />;
}

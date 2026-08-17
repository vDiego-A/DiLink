import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { getPostAuthRoute } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getOwnedProfileData } from "@/lib/supabase/profile-data";

export const metadata: Metadata = {
  title: "Editor de mi página",
  description: "Personaliza tu página y administra tus enlaces en DiLink.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const { isConfigured, claims } = await getServerAuthState();

  if (!isConfigured) redirect(`${APP_ROUTES.login}?authError=configuration`);
  if (!claims) redirect(APP_ROUTES.login);
  if (claims.user_metadata?.onboarding_completed !== true) {
    redirect(getPostAuthRoute(claims.user_metadata));
  }

  const data = await getOwnedProfileData(claims.sub, claims.user_metadata);

  return (
    <ProfileEditor
      initialProfile={data.profile}
      initialLinks={data.links}
      persistenceReady={data.persistenceReady}
    />
  );
}

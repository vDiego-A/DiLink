import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfile } from "@/components/profile/public-profile";
import { APP_NAME } from "@/lib/config";
import { getPublicProfileData } from "@/lib/supabase/profile-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfileData(username);

  if (!data) {
    return { title: `Página no encontrada | ${APP_NAME}`, robots: { index: false, follow: false } };
  }

  const title = `${data.profile.display_name || `@${data.profile.username}`} | ${APP_NAME}`;
  const description = data.profile.bio || `Descubre los enlaces de @${data.profile.username}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicUsernamePage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const data = await getPublicProfileData(username);
  if (!data) notFound();

  return <PublicProfile profile={data.profile} links={data.links} />;
}

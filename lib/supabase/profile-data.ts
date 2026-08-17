import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuthMetadata } from "@/lib/auth-flow";
import type { ProfileLinkRow, ProfileRow } from "@/types/database";

export type OwnedProfileData = {
  profile: ProfileRow;
  links: ProfileLinkRow[];
  persistenceReady: boolean;
};

export type PublicProfileData = {
  profile: ProfileRow;
  links: ProfileLinkRow[];
};

export async function getOwnedProfileData(
  userId: string,
  metadata: AuthMetadata,
): Promise<OwnedProfileData> {
  const supabase = await createServerSupabaseClient();
  const fallback = createFallbackProfile(userId, metadata);

  if (!supabase) {
    return { profile: fallback, links: [], persistenceReady: false };
  }

  const planSync = await supabase.rpc("sync_my_plan");
  if (planSync.error && planSync.error.code !== "PGRST202" && planSync.error.code !== "42883") {
    logDataError("sincronizar el plan", planSync.error.message);
  }

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    logDataError("leer el perfil", readError.message);
    return { profile: fallback, links: [], persistenceReady: false };
  }

  let profile = existingProfile;

  if (!profile) {
    const requestedUsername = buildInitialUsername(metadata, userId);
    const firstAttempt = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        username: requestedUsername,
        display_name: metadataString(metadata, "display_name") || "Mi DiLink",
        theme: allowedTheme(metadataString(metadata, "initial_theme")),
      })
      .select("*")
      .single();

    let createdProfile = firstAttempt.data;
    let createError = firstAttempt.error;

    if (createError?.code === "23505") {
      const uniqueUsername = `${requestedUsername.slice(0, 20)}-${userId.replace(/-/g, "").slice(0, 6)}`;
      const secondAttempt = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          username: uniqueUsername,
          display_name: metadataString(metadata, "display_name") || "Mi DiLink",
          theme: allowedTheme(metadataString(metadata, "initial_theme")),
        })
        .select("*")
        .single();

      createdProfile = secondAttempt.data;
      createError = secondAttempt.error;
    }

    if (createError || !createdProfile) {
      logDataError("crear el perfil", createError?.message ?? "Respuesta vacía");
      return { profile: fallback, links: [], persistenceReady: false };
    }

    profile = createdProfile;
    await seedFirstLink(profile.id, metadata);
  }

  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true });

  if (linksError) {
    logDataError("leer los enlaces", linksError.message);
    return { profile, links: [], persistenceReady: false };
  }

  return { profile, links: links ?? [], persistenceReady: true };
}

export async function getPublicProfileData(
  rawUsername: string,
): Promise<PublicProfileData | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const username = normalizeUsername(rawUsername);
  if (!username) return null;

  const { data: publicProfiles, error: profileError } = await supabase
    .rpc("get_public_profile", { profile_username: username });

  const publicProfile = publicProfiles?.[0];

  if (profileError || !publicProfile) return null;

  const profile: ProfileRow = {
    ...publicProfile,
    user_id: "",
    plan: publicProfile.plan === "pro" ? "pro" : "free",
  };

  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (linksError) return null;
  return { profile, links: links ?? [] };
}

export function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function createFallbackProfile(userId: string, metadata: AuthMetadata): ProfileRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    username: buildInitialUsername(metadata, userId),
    display_name: metadataString(metadata, "display_name") || "Mi DiLink",
    bio: "Todo lo que hago, en un solo lugar.",
    avatar_url: null,
    plan: "free",
    theme: allowedTheme(metadataString(metadata, "initial_theme")),
    primary_color: "#7C3AED",
    secondary_color: "#2563EB",
    font: "Inter",
    background_type: "theme",
    background_value: "",
    button_style: "rounded",
    show_branding: true,
    is_published: false,
    created_at: now,
    updated_at: now,
  };
}

function buildInitialUsername(metadata: AuthMetadata, userId: string) {
  const requested = normalizeUsername(metadataString(metadata, "requested_username"));
  if (requested.length >= 3 && !RESERVED_USERNAMES.has(requested)) return requested;
  return `usuario-${userId.replace(/-/g, "").slice(0, 8)}`;
}

async function seedFirstLink(profileId: string, metadata: AuthMetadata) {
  const firstLink = metadataString(metadata, "first_link_url").trim();
  if (!isSafeWebUrl(firstLink)) return;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from("links").insert({
    profile_id: profileId,
    title: detectLinkTitle(firstLink),
    url: firstLink,
    icon: detectLinkIcon(firstLink),
    position: 0,
  });
}

function detectLinkTitle(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
  if (host.includes("wa.me") || host.includes("whatsapp")) return "WhatsApp";
  return "Mi enlace";
}

function detectLinkIcon(url: string) {
  const value = url.toLowerCase();
  if (value.includes("instagram")) return "instagram";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
  if (value.includes("wa.me") || value.includes("whatsapp")) return "whatsapp";
  return "link";
}

function isSafeWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function allowedTheme(value: string) {
  return ["neon", "minimal", "aurora"].includes(value) ? value : "neon";
}

function metadataString(metadata: AuthMetadata, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function logDataError(operation: string, message: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Supabase Data] No se pudo ${operation}: ${message}`);
  }
}

const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "dashboard",
  "onboarding",
  "checkout",
  "pricing",
  "auth",
  "api",
  "admin",
  "settings",
  "forgot-password",
  "reset-password",
]);

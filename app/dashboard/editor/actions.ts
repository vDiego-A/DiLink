"use server";

import { revalidatePath } from "next/cache";
import { APP_ROUTES } from "@/lib/config";
import {
  isProfileEditorSaveInput,
  normalizeUsername,
  validateProfileEditorInput,
  type SaveProfileResult,
} from "@/lib/profile-editor";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveProfileChanges(input: unknown): Promise<SaveProfileResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, code: "setup", message: "Falta completar la configuración de Supabase." };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, code: "authentication", message: "Tu sesión venció. Inicia sesión nuevamente." };
  }

  if (!isProfileEditorSaveInput(input)) {
    return { ok: false, code: "validation", message: "Los datos recibidos no son válidos." };
  }

  const planSync = await supabase.rpc("sync_my_plan");
  if (planSync.error && planSync.error.code !== "PGRST202" && planSync.error.code !== "42883") {
    return { ok: false, code: "unexpected", message: "No pudimos verificar tu plan. Inténtalo nuevamente." };
  }

  const profileLookup = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileLookup.error) {
    return {
      ok: false,
      code: "setup",
      message: "La base de datos todavía no está preparada para guardar. Aplica las migraciones de Supabase y vuelve a intentarlo.",
    };
  }

  const plan = profileLookup.data?.plan ?? "free";
  const validationError = validateProfileEditorInput(input, plan);
  if (validationError) return { ok: false, code: "validation", message: validationError };

  if (!isAllowedAvatarUrl(input.avatarUrl, authData.user.id)) {
    return { ok: false, code: "validation", message: "La dirección de la foto de perfil no es válida." };
  }

  if (!isAllowedBackgroundMediaUrl(input.backgroundType, input.backgroundValue, authData.user.id)) {
    return { ok: false, code: "validation", message: "La dirección del fondo multimedia no es válida." };
  }

  const username = normalizeUsername(input.username);

  if (!profileLookup.data) {
    const { error: createError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      username,
      display_name: input.displayName.trim(),
      bio: input.bio.trim(),
      avatar_url: input.avatarUrl,
      theme: input.theme,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      font: input.font,
      button_style: input.buttonStyle,
      background_type: input.backgroundType,
      background_value: input.backgroundValue,
    });

    if (createError) {
      if (createError.code === "23505") {
        return { ok: false, code: "username", message: "Ese nombre de página ya está en uso. Prueba con otro." };
      }

      return { ok: false, code: "setup", message: "No pudimos crear tu perfil en Supabase. Comprueba las migraciones." };
    }
  }

  const { data, error } = await supabase.rpc("save_profile_editor", {
    profile_username: username,
    profile_display_name: input.displayName.trim(),
    profile_bio: input.bio.trim(),
    profile_avatar_url: input.avatarUrl,
    profile_theme: input.theme,
    profile_primary_color: input.primaryColor,
    profile_secondary_color: input.secondaryColor,
    profile_font: input.font,
    profile_button_style: input.buttonStyle,
    profile_background_type: input.backgroundType,
    profile_background_value: input.backgroundValue,
    profile_links: input.links.map((link) => ({
      id: link.id,
      title: link.title.trim(),
      url: link.url.trim(),
      icon: link.icon,
      is_active: link.isActive,
    })),
  });

  if (error || !data?.[0]) {
    if (process.env.NODE_ENV === "development" && error) {
      console.error(`[Supabase Data] No se pudo guardar el editor: ${error.message}`);
    }

    if (error?.code === "23505") {
      return { ok: false, code: "username", message: "Ese nombre de página ya está en uso. Prueba con otro." };
    }

    if (error?.code === "PGRST202" || error?.code === "42883") {
      return {
        ok: false,
        code: "setup",
        message: "Falta actualizar la función de guardado en Supabase. Ejecuta las migraciones pendientes y vuelve a intentarlo.",
      };
    }

    return { ok: false, code: "unexpected", message: "No pudimos guardar los cambios. Inténtalo nuevamente." };
  }

  revalidatePath(APP_ROUTES.dashboard);
  revalidatePath(APP_ROUTES.editor);
  revalidatePath(`/${username}`);

  return { ok: true, username: data[0].saved_username, isPublished: true };
}

function isAllowedAvatarUrl(value: string | null, userId: string) {
  if (!value) return true;
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const avatarUrl = new URL(value);
    const supabaseUrl = new URL(config.url);
    return (
      avatarUrl.origin === supabaseUrl.origin &&
      avatarUrl.pathname === `/storage/v1/object/public/avatars/${userId}/avatar`
    );
  } catch {
    return false;
  }
}

function isAllowedBackgroundMediaUrl(type: string, value: string, userId: string) {
  if (type !== "image" && type !== "video") return true;
  const config = getSupabaseConfig();
  if (!config) return false;

  try {
    const mediaUrl = new URL(value);
    const supabaseUrl = new URL(config.url);
    return (
      mediaUrl.origin === supabaseUrl.origin &&
      mediaUrl.pathname === `/storage/v1/object/public/background-assets/${userId}/background-${type}`
    );
  } catch {
    return false;
  }
}

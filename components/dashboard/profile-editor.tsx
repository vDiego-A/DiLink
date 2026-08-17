"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  Crown,
  Download,
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MonitorSmartphone,
  Palette,
  Plus,
  QrCode,
  Save,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { saveProfileChanges } from "@/app/dashboard/editor/actions";
import { AvatarMedia } from "@/components/profile/avatar-media";
import { PublicProfile } from "@/components/profile/public-profile";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_ROUTES } from "@/lib/config";
import { PLAN_LIMITS } from "@/lib/plans";
import {
  PROFILE_BUTTON_STYLES,
  PROFILE_COLOR_PRESETS,
  PROFILE_FONTS,
  PROFILE_THEMES,
  isGradientValue,
  isHexColor,
  usesProDesignFeatures,
} from "@/lib/profile-design";
import { detectLinkIcon, normalizeUsername } from "@/lib/profile-editor";
import { downloadProfileQr } from "@/lib/qr/download-profile-qr";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { uploadMediaResumably } from "@/lib/supabase/resumable-upload";
import type { ProfileLinkRow, ProfileRow } from "@/types/database";

type ProfileEditorProps = {
  initialProfile: ProfileRow;
  initialLinks: ProfileLinkRow[];
  persistenceReady: boolean;
};

type EditorTab = "content" | "design";
type MobilePanel = "editor" | "preview";
type SaveState = "idle" | "saving" | "saved" | "error";

export function ProfileEditor({ initialProfile, initialLinks, persistenceReady }: ProfileEditorProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(() => normalizeInitialDesign(initialProfile));
  const [publishedIdentity, setPublishedIdentity] = useState(() => ({
    displayName: initialProfile.display_name,
    username: initialProfile.username,
  }));
  const [links, setLinks] = useState(initialLinks);
  const [tab, setTab] = useState<EditorTab>("content");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("editor");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [showAllFonts, setShowAllFonts] = useState(false);
  const [pendingBackgroundFile, setPendingBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const origin = useSyncExternalStore(subscribeToOrigin, getBrowserOrigin, getServerOrigin);

  const activeLinks = useMemo(() => links.filter((link) => link.is_active).length, [links]);
  const maxLinks = PLAN_LIMITS[profile.plan].maxLinks;
  const publicPath = `/${profile.username}`;
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath;
  const isPro = profile.plan === "pro";
  const previewUsesProDesign = !isPro && usesProDesignFeatures({
    theme: profile.theme,
    primaryColor: profile.primary_color,
    secondaryColor: profile.secondary_color,
    font: profile.font,
    buttonStyle: profile.button_style,
    backgroundType: profile.background_type,
    backgroundValue: profile.background_value,
  });
  const previewProfile = useMemo(
    () => ({
      ...profile,
      avatar_url: avatarPreview || profile.avatar_url,
      background_value: backgroundPreview || profile.background_value,
      show_branding: previewUsesProDesign ? false : profile.show_branding,
    }),
    [avatarPreview, backgroundPreview, previewUsesProDesign, profile],
  );
  const backgroundColors = getGradientColors(
    profile.background_value,
    profile.primary_color,
    profile.secondary_color,
  );
  const visibleFonts = showAllFonts
    ? PROFILE_FONTS
    : PROFILE_FONTS.filter((font, index) => index < 6 || font.id === profile.font);

  useEffect(() => {
    return () => {
      if (backgroundPreview.startsWith("blob:")) URL.revokeObjectURL(backgroundPreview);
    };
  }, [backgroundPreview]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview.split("#")[0]);
    };
  }, [avatarPreview]);

  const updateProfile = <Key extends keyof ProfileRow>(key: Key, value: ProfileRow[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaveState("idle");
  };

  const selectBackgroundType = (type: "theme" | "gradient" | "solid" | "image" | "video") => {
    if (profile.background_type !== type) {
      setPendingBackgroundFile(null);
      setBackgroundPreview("");
    }

    setProfile((current) => ({
      ...current,
      background_type: type,
      background_value: type === "theme"
        ? ""
        : type === "solid"
          ? isHexColor(current.background_value) ? current.background_value : "#0F172A"
          : type === "gradient"
            ? isGradientValue(current.background_value)
              ? current.background_value
              : `${current.primary_color},${current.secondary_color}`
            : current.background_type === type && /^https?:\/\//.test(current.background_value)
              ? current.background_value
              : "",
    }));
    setSaveState("idle");
  };

  const resetToFreeDesign = () => {
    setPendingBackgroundFile(null);
    setBackgroundPreview("");
    setProfile((current) => ({
      ...current,
      theme: "neon",
      primary_color: "#7C3AED",
      secondary_color: "#2563EB",
      font: "Inter",
      button_style: "rounded",
      background_type: "theme",
      background_value: "",
      show_branding: true,
    }));
    setSaveState("idle");
    setFeedback("Restauramos un diseño compatible con Free. Ya puedes guardar los cambios.");
  };

  const addLink = () => {
    if (maxLinks !== null && links.length >= maxLinks) {
      setFeedback(`El plan Free permite hasta ${maxLinks} enlaces. Puedes editar o eliminar uno existente.`);
      return;
    }

    const now = new Date().toISOString();
    setLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        profile_id: profile.id,
        title: `Nuevo enlace ${current.length + 1}`,
        url: "",
        icon: "link",
        position: current.length,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
    setFeedback("");
    setSaveState("idle");
  };

  const updateLink = <Key extends keyof ProfileLinkRow>(id: string, key: Key, value: ProfileLinkRow[Key]) => {
    setLinks((current) =>
      current.map((link) => {
        if (link.id !== id) return link;
        const next = { ...link, [key]: value };
        if (key === "url" && typeof value === "string") next.icon = detectLinkIcon(value);
        return next;
      }),
    );
    setSaveState("idle");
  };

  const removeLink = (id: string) => {
    setLinks((current) => current.filter((link) => link.id !== id).map((link, index) => ({ ...link, position: index })));
    setSaveState("idle");
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    setLinks((current) => {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered.map((link, position) => ({ ...link, position }));
    });
    setSaveState("idle");
  };

  const chooseAvatar = (file: File | undefined) => {
    if (!file) return;

    const mediaKind = getAvatarMediaKind(file);
    if (!mediaKind) {
      setSaveState("error");
      setFeedback("Selecciona una imagen, GIF animado o archivo de video válido.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(mediaKind === "video" ? `${previewUrl}#media=video` : previewUrl);
    setPendingAvatar(file);
    setRemoveAvatar(false);
    setSaveState("idle");
    setFeedback(mediaKind === "video" ? "Video de perfil listo. Guarda los cambios para publicarlo." : "Imagen de perfil lista. Guarda los cambios para publicarla.");
  };

  const clearAvatar = () => {
    setAvatarPreview("");
    setPendingAvatar(null);
    setRemoveAvatar(true);
    updateProfile("avatar_url", null);
    setFeedback("La foto se quitará cuando guardes los cambios.");
  };

  const chooseBackgroundMedia = async (file: File | undefined, type: "image" | "video") => {
    if (!file) return;

    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const validType = type === "image" ? imageTypes.includes(file.type) : isVideoFile(file);

    if (!validType) {
      setSaveState("error");
      setFeedback(type === "image" ? "Selecciona una imagen JPG, PNG o WebP." : "Selecciona un archivo de video compatible con tu dispositivo.");
      return;
    }

    if (type === "image" && file.size > 20 * 1024 * 1024) {
      setSaveState("error");
      setFeedback("La imagen de fondo debe pesar máximo 20 MB.");
      return;
    }

    if (type === "video") {
      try {
        const duration = await getVideoDuration(file);
        if (!Number.isFinite(duration) || duration > 30.1) {
          setSaveState("error");
          setFeedback("El video de fondo debe durar máximo 30 segundos.");
          return;
        }
      } catch {
        setSaveState("error");
        setFeedback("No pudimos leer la duración del video. Prueba con otro archivo.");
        return;
      }
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingBackgroundFile(file);
    setBackgroundPreview(previewUrl);
    setProfile((current) => ({ ...current, background_type: type, background_value: "" }));
    setSaveState("idle");
    setFeedback(type === "image" ? "Imagen lista en la vista previa." : "Video listo: se reproducirá sin sonido y en bucle.");
  };

  const saveChanges = async () => {
    if (previewUsesProDesign) {
      setSaveState("error");
      setFeedback("Esta vista usa funciones Pro. Puedes probarla en tiempo real, pero necesitas Pro para guardarla.");
      return;
    }

    if (
      (profile.background_type === "image" || profile.background_type === "video") &&
      !pendingBackgroundFile &&
      !/^https?:\/\//.test(profile.background_value)
    ) {
      setSaveState("error");
      setFeedback(profile.background_type === "image" ? "Selecciona una imagen de fondo antes de guardar." : "Selecciona un video de fondo antes de guardar.");
      return;
    }

    const validationError = validateEditor(profile, links);
    if (validationError) {
      setSaveState("error");
      setFeedback(validationError);
      return;
    }

    setSaveState("saving");
    setFeedback("");

    let avatarUrl = profile.avatar_url;
    let backgroundValue = profile.background_value;
    const avatarPath = `${profile.user_id}/avatar`;
    const backgroundImagePath = `${profile.user_id}/background-image`;
    const backgroundVideoPath = `${profile.user_id}/background-video`;

    if (pendingAvatar) {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setSaveState("error");
        setFeedback("No pudimos conectar con Supabase.");
        return;
      }

      const avatarKind = getAvatarMediaKind(pendingAvatar);
      try {
        await uploadMediaResumably({
          bucket: "avatars",
          objectPath: avatarPath,
          file: pendingAvatar,
          contentType: getUploadContentType(pendingAvatar, avatarKind || "image"),
          onProgress: (percentage) => setFeedback(`Subiendo perfil… ${percentage}%`),
        });
      } catch {
        setSaveState("error");
        setFeedback("No pudimos subir el archivo de perfil. Comprueba la conexión y la migración más reciente de Storage.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
      avatarUrl = `${data.publicUrl}?v=${Date.now()}&media=${avatarKind || "image"}`;
    }

    if (pendingBackgroundFile && (profile.background_type === "image" || profile.background_type === "video")) {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setSaveState("error");
        setFeedback("No pudimos conectar con Supabase para subir el fondo.");
        return;
      }

      const backgroundPath = profile.background_type === "image" ? backgroundImagePath : backgroundVideoPath;
      try {
        await uploadMediaResumably({
          bucket: "background-assets",
          objectPath: backgroundPath,
          file: pendingBackgroundFile,
          contentType: getUploadContentType(pendingBackgroundFile, profile.background_type),
          onProgress: (percentage) => setFeedback(`Subiendo fondo… ${percentage}%`),
        });
      } catch {
        setSaveState("error");
        setFeedback("No pudimos subir el fondo. Comprueba que aplicaste la migración más reciente de Supabase.");
        return;
      }

      const { data } = supabase.storage.from("background-assets").getPublicUrl(backgroundPath);
      backgroundValue = `${data.publicUrl}?v=${Date.now()}`;
    }

    const result = await saveProfileChanges({
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl,
      theme: profile.theme,
      primaryColor: profile.primary_color,
      secondaryColor: profile.secondary_color,
      font: profile.font,
      buttonStyle: profile.button_style,
      backgroundType: profile.background_type,
      backgroundValue,
      links: links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: detectLinkIcon(link.url),
        isActive: link.is_active,
      })),
    });

    if (!result.ok) {
      setSaveState("error");
      setFeedback(result.message);
      return;
    }

    if (removeAvatar) {
      const supabase = createBrowserSupabaseClient();
      if (supabase) await supabase.storage.from("avatars").remove([avatarPath]);
    }

    const backgroundStorage = createBrowserSupabaseClient();
    if (backgroundStorage) {
      if (profile.background_type === "image") {
        await backgroundStorage.storage.from("background-assets").remove([backgroundVideoPath]);
      } else if (profile.background_type === "video") {
        await backgroundStorage.storage.from("background-assets").remove([backgroundImagePath]);
      } else {
        await backgroundStorage.storage.from("background-assets").remove([backgroundImagePath, backgroundVideoPath]);
      }
    }

    setProfile((current) => ({
      ...current,
      username: result.username,
      avatar_url: avatarUrl,
      background_value: backgroundValue,
      is_published: result.isPublished,
    }));
    setPublishedIdentity({ displayName: profile.display_name, username: result.username });
    setPendingAvatar(null);
    setAvatarPreview("");
    setRemoveAvatar(false);
    setPendingBackgroundFile(null);
    setBackgroundPreview("");
    setSaveState("saved");
    setFeedback(`Cambios guardados. Tu página ya está publicada en ${origin || "este dominio"}/${result.username}.`);
    router.refresh();
  };

  const copyPublicLink = async () => {
    const url = `${window.location.origin}${publicPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback("No pudimos copiar el enlace. Puedes abrirlo y copiarlo desde el navegador.");
    }
  };

  const downloadQr = async () => {
    if (!profile.is_published) {
      setSaveState("error");
      setFeedback("Guarda y publica tu página antes de descargar su código QR.");
      return;
    }

    setDownloadingQr(true);
    setFeedback("");
    try {
      await downloadProfileQr({
        displayName: publishedIdentity.displayName,
        username: publishedIdentity.username,
        publicUrl: `${window.location.origin}/${publishedIdentity.username}`,
      });
      setFeedback("Código QR descargado correctamente.");
    } catch {
      setSaveState("error");
      setFeedback("No pudimos generar el código QR. Inténtalo nuevamente.");
    } finally {
      setDownloadingQr(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Logo />
            <span className="hidden h-6 w-px bg-[var(--border)] sm:block" aria-hidden="true" />
            <span className="hidden truncate text-xs text-[var(--muted)] sm:block">DiLink/{profile.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:inline-flex ${isPro ? "bg-violet-500/12 text-violet-500" : "border border-[var(--border)] text-[var(--muted)]"}`}>
              {isPro && <Crown className="size-3.5" aria-hidden="true" />}
              {profile.plan}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={saveChanges}
              disabled={saveState === "saving" || previewUsesProDesign}
              title={previewUsesProDesign ? "Esta vista usa funciones Pro y no puede guardarse con Free." : undefined}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {saveState === "saving" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : previewUsesProDesign ? <LockKeyhole className="size-4" aria-hidden="true" /> : saveState === "saved" ? <Check className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{saveState === "saving" ? "Guardando…" : previewUsesProDesign ? "Solo vista previa" : saveState === "saved" ? "Guardado y publicado" : "Guardar cambios"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">
        {!persistenceReady && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4 text-sm text-[var(--muted)]" role="alert">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden="true" />
            <p><strong className="text-[var(--foreground)]">Falta preparar Supabase.</strong> Ejecuta las migraciones incluidas para que el perfil, los pagos y las opciones Pro puedan almacenarse.</p>
          </div>
        )}

        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={APP_ROUTES.dashboard} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={copyPublicLink} className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold">
              {copied ? <Check className="size-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button
              type="button"
              onClick={downloadQr}
              disabled={downloadingQr || !profile.is_published}
              aria-label={downloadingQr ? "Generando código QR" : "Descargar Código QR"}
              title={!profile.is_published ? "Guarda tu página para activar el código QR." : "Descargar código QR como imagen PNG"}
              className="inline-flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-full border border-violet-400/40 bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {downloadingQr ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
              <span className="sm:hidden">{downloadingQr ? "Generando QR…" : "Descargar QR"}</span>
              <span className="hidden sm:inline">{downloadingQr ? "Generando código QR…" : "Descargar Código QR"}</span>
              {!downloadingQr && <QrCode className="hidden size-4 sm:block" aria-hidden="true" />}
            </button>
            {profile.is_published && (
              <Link href={publicPath} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold">
                <Eye className="size-3.5" aria-hidden="true" /> Abrir
              </Link>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.09),rgba(37,99,235,0.04),var(--surface))] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-text)]">Tu enlace público</p>
            <p className="mt-1 truncate text-sm font-semibold" title={publicUrl}>{publicUrl}</p>
            <p className="mt-1 text-[10px] text-[var(--muted)]">{profile.is_published ? "Visible para cualquier persona con el enlace." : "Se activará automáticamente al guardar los cambios."}</p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${profile.is_published ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}>
            {profile.is_published ? <Eye className="size-3.5" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
            {profile.is_published ? "Publicado" : "Listo para publicar"}
          </span>
        </div>

        {previewUsesProDesign && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
              <Eye className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
              <span><strong className="text-[var(--foreground)]">Vista previa Pro activa.</strong> Puedes explorar este efecto en tiempo real; para guardarlo necesitas activar Pro.</span>
            </p>
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={resetToFreeDesign} className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-xs font-semibold">Volver a diseño Free</button>
              <Link href={APP_ROUTES.checkout} className="inline-flex h-9 items-center justify-center rounded-full bg-violet-600 px-4 text-xs font-semibold text-white">Activar Pro</Link>
            </span>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 lg:hidden">
          <button type="button" onClick={() => setMobilePanel("editor")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mobilePanel === "editor" ? "bg-violet-600 text-white" : "text-[var(--muted)]"}`}>Editar</button>
          <button type="button" onClick={() => setMobilePanel("preview")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mobilePanel === "preview" ? "bg-violet-600 text-white" : "text-[var(--muted)]"}`}>Vista previa</button>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)] xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className={`${mobilePanel === "preview" ? "hidden" : "block"} min-w-0 lg:block`}>
            <div className="mb-5 flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
              <EditorTabButton active={tab === "content"} onClick={() => setTab("content")} icon={UserRound}>Contenido</EditorTabButton>
              <EditorTabButton active={tab === "design"} onClick={() => setTab("design")} icon={Palette}>Diseño</EditorTabButton>
            </div>

            {tab === "content" ? (
              <div className="space-y-5">
                <EditorSection title="Perfil" description="La información principal de tu página.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <EditorField label="Nombre público" value={profile.display_name} onChange={(value) => updateProfile("display_name", value)} maxLength={60} />
                    <EditorField label="Nombre de página" value={profile.username} onChange={(value) => updateProfile("username", normalizeUsername(value))} prefix="DiLink/" maxLength={30} />
                  </div>
                  <label className="mt-4 block text-sm font-semibold">
                    Bio
                    <textarea value={profile.bio} onChange={(event) => updateProfile("bio", event.target.value.slice(0, 160))} rows={3} placeholder="Cuéntale al mundo quién eres." className="auth-field mt-2 min-h-24 resize-y px-4 py-3" />
                    <span className="mt-1 block text-right text-[10px] text-[var(--muted-soft)]">{profile.bio.length}/160</span>
                  </label>
                </EditorSection>

                <EditorSection title="Enlaces" description={`${activeLinks} activos · ${maxLinks === null ? "sin límite" : `${links.length}/${maxLinks} usados`}`}>
                  {links.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-8 text-center">
                      <Link2 className="mx-auto size-6 text-violet-500" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold">Tu página está un poco vacía.</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">Agrega tu primer enlace para comenzar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((link, index) => (
                        <LinkEditorCard key={link.id} link={link} index={index} total={links.length} onChange={updateLink} onMove={moveLink} onRemove={removeLink} />
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={addLink} disabled={maxLinks !== null && links.length >= maxLinks} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/[0.06] text-sm font-semibold text-violet-500 disabled:cursor-not-allowed disabled:opacity-45">
                    <Plus className="size-4" aria-hidden="true" /> Agregar enlace
                  </button>
                  {!isPro && (
                    <p className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-center text-xs leading-5 text-[var(--muted)]">
                      <Crown className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
                      <span>Para agregar más enlaces actualiza al <Link href={APP_ROUTES.checkout} className="font-semibold text-violet-500 hover:underline">Plan Pro</Link>.</span>
                    </p>
                  )}
                </EditorSection>

                <EditorSection title="Publicación" description="Tu DiLink quedará disponible al guardar.">
                  <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-left">
                    <span className="flex items-center gap-3">
                      <span className={`grid size-10 place-items-center rounded-xl ${profile.is_published ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}>
                        {profile.is_published ? <Eye className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                      </span>
                      <span><strong className="block text-sm">{profile.is_published ? "Página publicada" : "Se publicará al guardar"}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{profile.is_published ? "Cualquier persona con el enlace puede verla." : "El perfil y todos sus enlaces se guardarán juntos."}</span></span>
                    </span>
                    <Check className={`size-5 shrink-0 ${profile.is_published ? "text-emerald-500" : "text-violet-500"}`} aria-hidden="true" />
                  </div>
                </EditorSection>
              </div>
            ) : (
              <div className="space-y-5">
                <EditorSection title="Foto de perfil" description="Elige una imagen, logo animado o video que identificará tu página.">
                  <div className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:flex-row sm:items-center">
                    <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-500">
                      {previewProfile.avatar_url ? (
                        <AvatarMedia
                          src={previewProfile.avatar_url}
                          alt="Vista previa de la foto de perfil"
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <Camera className="size-7" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Tu imagen o video aparecerá encima del nombre.</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Admite imágenes, GIF y videos. DiLink no impone un límite de peso; los archivos grandes se cargan por partes.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <label htmlFor="avatar-upload" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-semibold text-white focus-within:ring-2 focus-within:ring-violet-500">
                          <Upload className="size-3.5" aria-hidden="true" />
                          Elegir archivo
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*,video/*"
                            className="sr-only"
                            onChange={(event) => chooseAvatar(event.target.files?.[0])}
                          />
                        </label>
                        {previewProfile.avatar_url && (
                          <button type="button" onClick={clearAvatar} className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--muted)] hover:text-rose-500">
                            Quitar archivo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </EditorSection>

                <EditorSection title="Tema" description="Elige la dirección visual de tu DiLink.">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {PROFILE_THEMES.map((theme) => {
                      const isPremium = theme.minimumPlan === "pro";
                      const selected = profile.theme === theme.id;
                      return <button key={theme.id} type="button" aria-pressed={selected} onClick={() => updateProfile("theme", theme.id)} className={`relative rounded-2xl border p-3 text-left transition ${getSelectableOptionClasses(selected)}`}>
                        <span className="block aspect-[1.55] rounded-xl border border-white/10" style={{ background: theme.swatch }} />
                        {selected && <span className="absolute left-5 top-5 grid size-6 place-items-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-950/30"><Check className="size-3.5" aria-hidden="true" /></span>}
                        {isPremium && <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white"><Crown className="size-3" aria-hidden="true" />PRO</span>}
                        <strong className="mt-3 block text-sm">{theme.name}</strong><span className="mt-1 block text-[10px] text-[var(--muted)]">{theme.description}</span>
                      </button>;
                    })}
                  </div>
                </EditorSection>

                <EditorSection title="Paleta" description="Presets equilibrados para mantener una buena legibilidad.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PROFILE_COLOR_PRESETS.map((preset) => {
                      const selected = profile.primary_color === preset.primary && profile.secondary_color === preset.secondary;
                      const isPremium = preset.minimumPlan === "pro";
                      return <button key={preset.name} type="button" aria-pressed={selected} onClick={() => { setProfile((current) => ({ ...current, primary_color: preset.primary, secondary_color: preset.secondary })); setSaveState("idle"); }} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${getSelectableOptionClasses(selected)}`}><span className="flex -space-x-2"><span className="size-7 rounded-full border-2 border-[var(--surface)]" style={{ background: preset.primary }} /><span className="size-7 rounded-full border-2 border-[var(--surface)]" style={{ background: preset.secondary }} /></span><span className="text-xs font-semibold">{preset.name}</span><span className="ml-auto flex items-center gap-2">{isPremium && <Crown className="size-3.5 text-amber-500" aria-hidden="true" />}{selected && <span className="grid size-5 place-items-center rounded-full bg-violet-600 text-white"><Check className="size-3" aria-hidden="true" /></span>}</span></button>;
                    })}
                  </div>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4 sm:grid-cols-2">
                    <ColorInput label="Color principal" value={profile.primary_color} onChange={(value) => updateProfile("primary_color", value)} />
                    <ColorInput label="Color secundario" value={profile.secondary_color} onChange={(value) => updateProfile("secondary_color", value)} />
                  </div>
                  {!isPro && <ProFeatureNotice text="Puedes probar colores personalizados; para guardarlos necesitas Pro." />}
                </EditorSection>

                <EditorSection title="Tipografía" description="Define la personalidad del texto de tu página.">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleFonts.map((font) => {
                      const isPremium = font.minimumPlan === "pro";
                      const selected = profile.font === font.id;
                      return <button key={font.id} type="button" aria-pressed={selected} onClick={() => updateProfile("font", font.id)} className={`relative min-h-20 rounded-xl border p-3 text-left transition ${getSelectableOptionClasses(selected)}`} style={{ fontFamily: `${font.id}, ui-sans-serif, system-ui` }}><span className="block text-lg font-semibold">Aa</span><span className="mt-1 block text-xs">{font.label}</span><span className="absolute right-3 top-3 flex items-center gap-1.5">{isPremium && <Crown className="size-3.5 text-amber-500" aria-hidden="true" />}{selected && <span className="grid size-5 place-items-center rounded-full bg-violet-600 text-white"><Check className="size-3" aria-hidden="true" /></span>}</span></button>;
                    })}
                  </div>
                  <button type="button" onClick={() => setShowAllFonts((current) => !current)} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
                    {showAllFonts ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                    {showAllFonts ? "Ver menos" : `Ver más tipografías (${PROFILE_FONTS.length - visibleFonts.length})`}
                  </button>
                </EditorSection>

                <EditorSection title="Botones" description="Selecciona la forma de tus enlaces.">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PROFILE_BUTTON_STYLES.map((style) => {
                      const isPremium = style.minimumPlan === "pro";
                      const selected = profile.button_style === style.id;
                      return <button key={style.id} type="button" aria-pressed={selected} onClick={() => updateProfile("button_style", style.id)} style={getEditorButtonPreviewStyle(style.id, profile.primary_color, profile.secondary_color)} className={`relative h-14 border text-xs font-semibold transition ${style.id === "pill" ? "rounded-full" : style.id === "square" ? "rounded-md" : "rounded-2xl"} ${selected ? "outline-2 outline-offset-2 outline-violet-500" : "outline-none"}`}><span className={selected ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" : ""}>{style.name}</span>{selected && <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-violet-600 text-white shadow-md"><Check className="size-3" aria-hidden="true" /></span>}{isPremium && <Crown className="absolute right-2 top-2 size-3 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" aria-hidden="true" />}</button>;
                    })}
                  </div>
                </EditorSection>

                <EditorSection title="Fondo" description="Tema, gradiente, sólido e imagen están incluidos en Free. El video es una función Pro.">
                  <div className="grid grid-cols-3 gap-3">
                    <BackgroundTypeButton label="Tema" selected={profile.background_type === "theme"} onClick={() => selectBackgroundType("theme")} />
                    <BackgroundTypeButton label="Gradiente" selected={profile.background_type === "gradient"} onClick={() => selectBackgroundType("gradient")} />
                    <BackgroundTypeButton label="Sólido" selected={profile.background_type === "solid"} onClick={() => selectBackgroundType("solid")} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <BackgroundTypeButton label="Imagen · Free" selected={profile.background_type === "image"} icon={ImagePlus} onClick={() => selectBackgroundType("image")} />
                    <BackgroundTypeButton label="Video · 30 s" selected={profile.background_type === "video"} locked={!isPro} icon={Film} onClick={() => selectBackgroundType("video")} />
                  </div>
                  {profile.background_type === "gradient" && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4 sm:grid-cols-2">
                      <ColorInput label="Inicio" value={backgroundColors[0]} onChange={(value) => updateProfile("background_value", `${value},${backgroundColors[1]}`)} />
                      <ColorInput label="Final" value={backgroundColors[1]} onChange={(value) => updateProfile("background_value", `${backgroundColors[0]},${value}`)} />
                    </div>
                  )}
                  {profile.background_type === "solid" && (
                    <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
                      <ColorInput label="Color de fondo" value={isHexColor(profile.background_value) ? profile.background_value : "#0F172A"} onChange={(value) => updateProfile("background_value", value)} />
                    </div>
                  )}
                  {(profile.background_type === "image" || profile.background_type === "video") && (
                    <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <strong className="text-sm">{profile.background_type === "image" ? "Imagen de fondo" : "Video de fondo"}</strong>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {profile.background_type === "image"
                              ? "JPG, PNG o WebP de máximo 20 MB. Aplicaremos una sombra para conservar la lectura."
                              : "Máximo 30 segundos. Para la mayor compatibilidad entre iPhone y Android usa MP4 con video H.264; WebM, MOV y otros formatos se aceptan si el navegador puede reproducirlos."}
                          </p>
                        </div>
                        <label htmlFor="background-media-upload" className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-semibold text-white focus-within:ring-2 focus-within:ring-violet-500">
                          <Upload className="size-3.5" aria-hidden="true" />
                          Elegir archivo
                          <input
                            id="background-media-upload"
                            type="file"
                            accept={profile.background_type === "image" ? "image/jpeg,image/png,image/webp" : "video/*"}
                            className="sr-only"
                            onChange={(event) => chooseBackgroundMedia(event.target.files?.[0], profile.background_type as "image" | "video")}
                          />
                        </label>
                      </div>
                      {(pendingBackgroundFile || profile.background_value) && (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <span className="min-w-0 truncate text-xs text-[var(--muted)]">{pendingBackgroundFile?.name || "Fondo guardado actualmente"}</span>
                          <button type="button" onClick={() => selectBackgroundType("theme")} className="shrink-0 text-xs font-semibold text-rose-500">Quitar</button>
                        </div>
                      )}
                    </div>
                  )}
                  {!isPro && profile.background_type === "video" && <ProFeatureNotice text="Puedes probar este video en tiempo real; para subirlo y guardarlo necesitas Pro." />}
                </EditorSection>
              </div>
            )}

            {feedback && <p className={`mt-5 rounded-xl border p-3 text-xs ${saveState === "error" ? "border-rose-400/25 bg-rose-400/[0.08]" : "border-emerald-400/25 bg-emerald-400/[0.08]"}`} role={saveState === "error" ? "alert" : "status"}>{feedback}</p>}
          </section>

          <aside className={`${mobilePanel === "editor" ? "hidden" : "block"} lg:sticky lg:top-24 lg:block`}>
            <div className="editor-shell relative mx-auto max-w-[430px] rounded-[2.75rem] border border-[var(--border)] bg-[#0b0b12] p-3 shadow-[0_35px_90px_rgba(10,5,30,0.25)]">
              <div className="mb-3 flex items-center justify-center gap-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500"><MonitorSmartphone className="size-3.5" aria-hidden="true" />Preview en tiempo real</div>
              <PublicProfile profile={previewProfile} links={links} preview />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function EditorTabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof UserRound; children: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${active ? "bg-violet-600 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}><Icon className="size-4" aria-hidden="true" />{children}</button>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-6"><h2 className="text-lg font-semibold tracking-[-0.025em]">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p><div className="mt-5">{children}</div></section>;
}

function EditorField({ label, value, onChange, prefix, maxLength }: { label: string; value: string; onChange: (value: string) => void; prefix?: string; maxLength?: number }) {
  return <label className="block text-sm font-semibold">{label}<div className="relative mt-2">{prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">{prefix}</span>}<input type="text" value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} className={`auth-field px-4 ${prefix ? "pl-[4.15rem]" : ""}`} /></div></label>;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-semibold">
      <span>{label}<span className="mt-1 block font-mono text-[10px] font-normal text-[var(--muted)]">{value}</span></span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="size-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={label} />
    </label>
  );
}

function BackgroundTypeButton({ label, selected, locked = false, icon: Icon, onClick }: { label: string; selected: boolean; locked?: boolean; icon?: typeof ImagePlus; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`relative inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition ${selected ? "border-violet-500 bg-violet-500/[0.14] text-violet-500 shadow-[0_0_0_3px_rgba(124,58,237,0.14)]" : "border-[var(--border)] bg-[var(--surface-soft)]"}`}>
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {label}
      {selected && <Check className="size-3.5" aria-hidden="true" />}
      {locked && <Crown className="absolute right-2 top-2 size-3 text-amber-500" aria-hidden="true" />}
    </button>
  );
}

function ProFeatureNotice({ text }: { text: string }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2"><Crown className="size-3.5 shrink-0 text-amber-500" aria-hidden="true" />{text}</p>
      <Link href={APP_ROUTES.checkout} className="shrink-0 font-semibold text-violet-500 hover:text-violet-400">Conocer Pro</Link>
    </div>
  );
}

function getEditorButtonPreviewStyle(style: string, primary: string, secondary: string): CSSProperties {
  if (style === "outline") return { background: "transparent", borderColor: "var(--border-strong)", color: "var(--foreground)" };
  if (style === "glass") return { background: "rgba(255,255,255,0.10)", borderColor: "rgba(139,92,246,0.28)", backdropFilter: "blur(12px)", color: "var(--foreground)" };
  if (style === "glow") return { background: `${primary}22`, borderColor: primary, color: "var(--foreground)", boxShadow: `0 0 24px ${primary}55` };
  if (style === "liquid-glass") return { background: "linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06))", borderColor: "rgba(255,255,255,0.42)", color: "var(--foreground)", backdropFilter: "blur(18px) saturate(145%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.52),0 12px 30px rgba(15,23,42,0.16)" };
  if (style === "neon-outline") return { background: "transparent", borderColor: primary, color: primary, boxShadow: `0 0 8px ${primary},inset 0 0 12px ${primary}33` };
  if (style === "soft-3d") return { background: "var(--surface-soft)", borderColor: "var(--border)", color: "var(--foreground)", boxShadow: `0 7px 0 ${secondary}66,0 12px 22px rgba(15,23,42,0.16)` };
  if (style === "gradient") return { background: `linear-gradient(135deg,${primary},${secondary})`, borderColor: "rgba(255,255,255,0.2)", color: "#ffffff", boxShadow: `0 12px 30px ${primary}44` };
  return { background: "var(--surface-soft)", borderColor: "var(--border)", color: "var(--foreground)" };
}

function getSelectableOptionClasses(selected: boolean) {
  return selected
    ? "border-violet-500 bg-violet-500/[0.13] shadow-[0_0_0_3px_rgba(124,58,237,0.14),0_14px_30px_rgba(76,29,149,0.12)]"
    : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-violet-400/45";
}

function LinkEditorCard({ link, index, total, onChange, onMove, onRemove }: { link: ProfileLinkRow; index: number; total: number; onChange: <Key extends keyof ProfileLinkRow>(id: string, key: Key, value: ProfileLinkRow[Key]) => void; onMove: (index: number, direction: -1 | 1) => void; onRemove: (id: string) => void }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-500">{index + 1}</span>
        <strong className="min-w-0 flex-1 text-xs">Enlace {index + 1}</strong>
        <button
          type="button"
          onClick={() => onChange(link.id, "is_active", !link.is_active)}
          className={`grid size-9 shrink-0 place-items-center rounded-lg border ${link.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-[var(--border)] text-[var(--muted)]"}`}
          aria-label={link.is_active ? "Desactivar enlace" : "Activar enlace"}
        >
          {link.is_active ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Coloque el nombre de la red</span>
        <span className="ml-2 text-[10px] text-[var(--muted-soft)]">Ej: TikTok</span>
        <input
          value={link.title}
          onChange={(event) => onChange(link.id, "title", event.target.value.slice(0, 80))}
          placeholder="Ej: TikTok"
          className="auth-field mt-2 px-3"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Pegue el enlace de la red</span>
        <span className="ml-2 text-[10px] text-[var(--muted-soft)]">Ej: https://tiktok.com/@usuario</span>
        <input
          type="url"
          value={link.url}
          onChange={(event) => onChange(link.id, "url", event.target.value.slice(0, 2048))}
          placeholder="https://tu-enlace.com"
          className="auth-field mt-2 px-3"
        />
      </label>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-30" aria-label="Subir enlace"><ArrowUp className="size-3.5" aria-hidden="true" /></button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-30" aria-label="Bajar enlace"><ArrowDown className="size-3.5" aria-hidden="true" /></button>
        <button type="button" onClick={() => onRemove(link.id)} className="grid size-8 place-items-center rounded-lg border border-rose-400/20 text-rose-500" aria-label="Eliminar enlace"><Trash2 className="size-3.5" aria-hidden="true" /></button>
      </div>
    </article>
  );
}

function validateEditor(profile: ProfileRow, links: ProfileLinkRow[]) {
  if (profile.display_name.trim().length < 2) return "El nombre público debe tener al menos 2 caracteres.";
  const username = normalizeUsername(profile.username);
  if (username.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username)) return "El nombre de página debe tener entre 3 y 30 caracteres, sin espacios.";
  const maxLinks = PLAN_LIMITS[profile.plan].maxLinks;
  if (maxLinks !== null && links.length > maxLinks) return `El plan Free permite un máximo de ${maxLinks} enlaces.`;
  for (const link of links) {
    if (!link.title.trim()) return "Todos los enlaces necesitan un título.";
    try { const url = new URL(link.url.trim()); if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("invalid"); } catch { return `La URL de “${link.title}” no es válida. Debe comenzar con http:// o https://.`; }
  }
  return "";
}

function normalizeInitialDesign(profile: ProfileRow): ProfileRow {
  if (profile.background_type === "gradient" && profile.background_value.startsWith("linear-gradient(")) {
    return { ...profile, background_type: "theme", background_value: "" };
  }

  return profile;
}

function getGradientColors(value: string, fallbackStart: string, fallbackEnd: string): [string, string] {
  if (!isGradientValue(value)) return [fallbackStart, fallbackEnd];
  const [start, end] = value.split(",");
  return [start, end];
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("invalid_video"));
    };
    video.src = objectUrl;
  });
}

function getAvatarMediaKind(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/") || hasExtension(file, IMAGE_EXTENSIONS)) return "image";
  if (isVideoFile(file)) return "video";
  return null;
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || hasExtension(file, VIDEO_EXTENSIONS);
}

function hasExtension(file: File, extensions: ReadonlySet<string>) {
  const extension = file.name.toLowerCase().split(".").pop();
  return Boolean(extension && extensions.has(extension));
}

function getUploadContentType(file: File, kind: string) {
  if (file.type.startsWith(`${kind}/`)) return file.type;

  const extension = file.name.toLowerCase().split(".").pop() || "";
  if (kind === "video") return VIDEO_CONTENT_TYPES[extension] || "video/mp4";
  return IMAGE_CONTENT_TYPES[extension] || "image/jpeg";
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "webm", "mov", "qt", "ogv", "ogg", "avi", "mkv", "3gp", "3g2", "mpeg", "mpg", "ts"]);
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};
const VIDEO_CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  qt: "video/quicktime",
  ogv: "video/ogg",
  ogg: "video/ogg",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  ts: "video/mp2t",
};

function subscribeToOrigin() {
  return () => undefined;
}

function getBrowserOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

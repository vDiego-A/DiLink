import { createServerSupabaseClient } from "@/lib/supabase/server";

type AnalyticsEventBody = {
  profileId?: unknown;
  linkId?: unknown;
  eventType?: unknown;
  referrer?: unknown;
};

export async function POST(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return new Response(null, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048) return new Response(null, { status: 413 });

  let body: AnalyticsEventBody;
  try {
    body = await request.json() as AnalyticsEventBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  if (
    typeof body.profileId !== "string" ||
    !UUID_PATTERN.test(body.profileId) ||
    (body.eventType !== "profile_view" && body.eventType !== "link_click") ||
    (body.eventType === "link_click" && (typeof body.linkId !== "string" || !UUID_PATTERN.test(body.linkId)))
  ) {
    return new Response(null, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Response(null, { status: 503 });

  const { error } = await supabase.rpc("track_public_analytics_event", {
    target_profile_id: body.profileId,
    target_link_id: body.eventType === "link_click" ? body.linkId as string : null,
    target_event_type: body.eventType,
    referrer_input: getReferrerHost(body.referrer, request.url),
    device_type_input: getDeviceType(request.headers.get("user-agent") ?? ""),
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Analytics] No se pudo registrar el evento: ${error.message}`);
    }
    return new Response(null, { status: 503 });
  }

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

function getReferrerHost(value: unknown, requestUrl: string) {
  if (typeof value !== "string" || !value.trim()) return "Directo";

  try {
    const referrer = new URL(value);
    const currentHost = new URL(requestUrl).hostname;
    return referrer.hostname === currentHost ? "Directo" : referrer.hostname.slice(0, 160);
  } catch {
    return "Directo";
  }
}

function getDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

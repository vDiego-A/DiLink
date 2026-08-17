import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AnalyticsOverview = {
  ready: boolean;
  totalViews: number;
  totalClicks: number;
  periodViews: number;
  periodClicks: number;
};

export type AnalyticsDay = {
  day: string;
  views: number;
  clicks: number;
};

export type LinkAnalytics = {
  linkId: string;
  title: string;
  clicks: number;
};

export type OwnedAnalyticsData = AnalyticsOverview & {
  advancedReady: boolean;
  daily: AnalyticsDay[];
  links: LinkAnalytics[];
};

const EMPTY_OVERVIEW: AnalyticsOverview = {
  ready: false,
  totalViews: 0,
  totalClicks: 0,
  periodViews: 0,
  periodClicks: 0,
};

export async function getAnalyticsOverview(profileId: string): Promise<AnalyticsOverview> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return EMPTY_OVERVIEW;

  const { data, error } = await supabase.rpc("get_my_analytics_overview", {
    target_profile_id: profileId,
  });

  if (error) {
    logAnalyticsError("cargar el resumen", error);
    return EMPTY_OVERVIEW;
  }

  const overview = data?.[0];
  if (!overview) return { ...EMPTY_OVERVIEW, ready: true };

  return {
    ready: true,
    totalViews: Number(overview.total_views),
    totalClicks: Number(overview.total_clicks),
    periodViews: Number(overview.period_views),
    periodClicks: Number(overview.period_clicks),
  };
}

export async function getOwnedAnalyticsData(profileId: string, isPro: boolean): Promise<OwnedAnalyticsData> {
  const overview = await getAnalyticsOverview(profileId);
  if (!overview.ready || !isPro) {
    return { ...overview, advancedReady: false, daily: [], links: [] };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ...overview, advancedReady: false, daily: [], links: [] };

  const [dailyResult, linksResult] = await Promise.all([
    supabase.rpc("get_my_analytics_daily", { target_profile_id: profileId, days_input: 30 }),
    supabase.rpc("get_my_link_analytics", { target_profile_id: profileId, days_input: 30 }),
  ]);

  if (dailyResult.error) logAnalyticsError("cargar la actividad diaria", dailyResult.error);
  if (linksResult.error) logAnalyticsError("cargar los clics por enlace", linksResult.error);

  return {
    ...overview,
    advancedReady: !dailyResult.error && !linksResult.error,
    daily: (dailyResult.data ?? []).map((day) => ({
      day: day.event_day,
      views: Number(day.views),
      clicks: Number(day.clicks),
    })),
    links: (linksResult.data ?? []).map((link) => ({
      linkId: link.analytics_link_id,
      title: link.analytics_link_title,
      clicks: Number(link.click_count),
    })),
  };
}

function logAnalyticsError(operation: string, error: PostgrestError) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Analytics] No se pudo ${operation}: ${error.message}`);
  }
}

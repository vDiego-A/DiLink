import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseRemotePatterns = getSupabaseRemotePatterns(supabaseUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseRemotePatterns,
  },
};

export default nextConfig;

function getSupabaseRemotePatterns(value: string | undefined) {
  if (!value) return [];

  try {
    const url = new URL(value);
    const base = {
      protocol: url.protocol === "http:" ? ("http" as const) : ("https" as const),
      hostname: url.hostname,
      port: url.port,
    };

    return [
      { ...base, pathname: "/storage/v1/object/public/avatars/**" },
      { ...base, pathname: "/storage/v1/object/public/background-assets/**" },
    ];
  } catch {
    return [];
  }
}

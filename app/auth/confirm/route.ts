import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRoute } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supportedEmailOtpTypes: readonly EmailOtpType[] = [
  "email",
  "signup",
  "recovery",
];

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(request.nextUrl.searchParams.get("type"));
  const defaultNext = type === "recovery" ? APP_ROUTES.resetPassword : APP_ROUTES.dashboard;
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"), defaultNext);
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL(`${APP_ROUTES.login}?authError=configuration`, request.nextUrl.origin),
    );
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      const destination =
        type === "recovery" ? next : getPostAuthRoute(data.user?.user_metadata);
      return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
    }
  }

  const errorDestination =
    type === "recovery"
      ? `${APP_ROUTES.forgotPassword}?authError=invalid`
      : `${APP_ROUTES.login}?authError=oauth`;

  return NextResponse.redirect(new URL(errorDestination, request.nextUrl.origin));
}

function getEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  return supportedEmailOtpTypes.includes(value as EmailOtpType)
    ? (value as EmailOtpType)
    : null;
}

function getSafeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

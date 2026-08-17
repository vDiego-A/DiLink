import { NextResponse } from "next/server";
import { getPostAuthRoute } from "@/lib/auth-flow";
import { APP_ROUTES } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const supabase = await createServerSupabaseClient();
  const errorDestination =
    next === APP_ROUTES.resetPassword
      ? `${APP_ROUTES.forgotPassword}?authError=invalid`
      : `${APP_ROUTES.login}?authError=oauth`;

  if (!code || !supabase) {
    return NextResponse.redirect(
      new URL(
        supabase ? errorDestination : `${APP_ROUTES.login}?authError=configuration`,
        requestUrl.origin,
      ),
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(errorDestination, requestUrl.origin));
  }

  let authMetadata = data.session?.user.user_metadata;

  if (
    (next === APP_ROUTES.checkout || next === APP_ROUTES.onboarding) &&
    authMetadata?.selected_plan !== "free" &&
    authMetadata?.selected_plan !== "pro"
  ) {
    const selectedPlan = next === APP_ROUTES.checkout ? "pro" : "free";
    await supabase.auth.updateUser({
      data: {
        selected_plan: selectedPlan,
        onboarding_completed: false,
      },
    });
    authMetadata = {
      ...authMetadata,
      selected_plan: selectedPlan,
      onboarding_completed: false,
    };
  }

  const destination =
    next === APP_ROUTES.resetPassword
      ? next
      : getPostAuthRoute(authMetadata);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destination}`);
  }

  return NextResponse.redirect(`${requestUrl.origin}${destination}`);
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return APP_ROUTES.home;
  }

  return value;
}

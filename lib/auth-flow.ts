import { APP_ROUTES } from "@/lib/config";

export type AuthMetadata = Record<string, unknown> | null | undefined;

export function getPostAuthRoute(metadata: AuthMetadata) {
  if (metadata?.onboarding_completed === true) {
    return APP_ROUTES.dashboard;
  }

  if (metadata?.selected_plan === "pro") {
    return APP_ROUTES.checkout;
  }

  return APP_ROUTES.onboarding;
}

export function getMetadataString(metadata: AuthMetadata, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

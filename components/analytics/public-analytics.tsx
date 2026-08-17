"use client";

import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

type AnalyticsEventPayload = {
  profileId: string;
  linkId: string | null;
  eventType: "profile_view" | "link_click";
};

export function AnalyticsPageView({ profileId }: { profileId: string }) {
  useEffect(() => {
    const storageKey = `dilink-profile-view:${profileId}`;
    const now = Date.now();

    try {
      const previousView = Number(sessionStorage.getItem(storageKey));
      if (Number.isFinite(previousView) && now - previousView < 30 * 60 * 1000) return;
      sessionStorage.setItem(storageKey, String(now));
    } catch {
      // El tracking puede continuar aunque el navegador bloquee sessionStorage.
    }

    sendAnalyticsEvent({ profileId, linkId: null, eventType: "profile_view" });
  }, [profileId]);

  return null;
}

type TrackedPublicLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  profileId: string;
  linkId: string;
  children: ReactNode;
};

export function TrackedPublicLink({ profileId, linkId, children, ...anchorProps }: TrackedPublicLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={() => sendAnalyticsEvent({ profileId, linkId, eventType: "link_click" })}
    >
      {children}
    </a>
  );
}

function sendAnalyticsEvent(payload: AnalyticsEventPayload) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, referrer: document.referrer }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    // Analytics nunca debe bloquear la experiencia pública.
  });
}

"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export function PriceConverter({ compact = false }: { compact?: boolean }) {
  const [showBolivars, setShowBolivars] = useState(false);
  const primaryPrice = showBolivars
    ? APP_CONFIG.pricing.proBolivarsLabel
    : APP_CONFIG.pricing.proMonthlyLabel;
  const secondaryPrice = showBolivars
    ? `${APP_CONFIG.pricing.proMonthlyLabel} USD`
    : APP_CONFIG.pricing.proBolivarsLabel;

  return (
    <div className={`flex flex-wrap items-end gap-2 ${compact ? "" : "sm:gap-3"}`}>
      <strong
        className={
          compact
            ? "text-2xl font-semibold tracking-[-0.04em]"
            : "text-5xl font-semibold tracking-[-0.055em]"
        }
      >
        {primaryPrice}
      </strong>
      <span className={`${compact ? "pb-0.5 text-xs" : "pb-1.5 text-sm"} text-[var(--muted)]`}>
        {APP_CONFIG.pricing.proPeriod}
      </span>
      <button
        type="button"
        onClick={() => setShowBolivars((current) => !current)}
        className={`${compact ? "mb-0" : "mb-1"} inline-flex h-8 items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-3 text-[10px] font-bold text-[var(--accent-text)] transition-colors hover:bg-violet-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
        aria-label={`Mostrar precio principal en ${showBolivars ? "dólares" : "bolívares"}`}
      >
        <ArrowLeftRight className="size-3" aria-hidden="true" />
        {secondaryPrice}
      </button>
    </div>
  );
}

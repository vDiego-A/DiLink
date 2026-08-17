import Link from "next/link";
import { Link2 } from "lucide-react";
import { APP_NAME, APP_ROUTES, LOGO_MARK_NAME } from "@/lib/config";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      href={APP_ROUTES.home}
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      aria-label={`${APP_NAME}, inicio`}
    >
      <span
        className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-white/15 bg-[#10101b] shadow-[0_8px_24px_rgba(124,58,237,0.24)]"
        title={LOGO_MARK_NAME}
        aria-hidden="true"
      >
        <span className="absolute -left-2 -top-2 size-7 rounded-full bg-violet-500/80 blur-md" />
        <span className="absolute -bottom-2 -right-2 size-7 rounded-full bg-cyan-400/60 blur-md" />
        <span className="relative flex items-center">
          <span className="bg-gradient-to-br from-white via-violet-100 to-cyan-200 bg-clip-text text-[21px] font-black italic leading-none tracking-[-0.14em] text-transparent">
            V
          </span>
          <span className="absolute -bottom-1 -right-2 grid size-3.5 place-items-center rounded-full border border-white/20 bg-violet-500 text-white shadow-[0_2px_8px_rgba(124,58,237,0.5)]">
            <Link2 className="size-2" strokeWidth={2.8} />
          </span>
        </span>
      </span>
      {!compact && (
        <span className="text-[17px] font-bold tracking-[-0.035em] text-[var(--foreground)]">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}

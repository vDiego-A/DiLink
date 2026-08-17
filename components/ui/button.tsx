import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-violet-300/20 bg-[linear-gradient(135deg,#8b5cf6_0%,#6d4aff_48%,#2563eb_100%)] text-white shadow-[0_14px_45px_rgba(91,65,255,0.32)] hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(91,65,255,0.42)]",
  secondary:
    "border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--subtle-hover)]",
  ghost: "border border-transparent text-[var(--muted)] hover:bg-[var(--subtle-hover)] hover:text-[var(--foreground)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-[15px] sm:px-7",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ariaLabel,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
}

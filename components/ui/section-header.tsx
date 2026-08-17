type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${className}`}
    >
      {eyebrow && (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">
          {eyebrow}
        </p>
      )}
      <h2 className="section-title text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-7 text-[var(--muted)] sm:text-lg">
        {description}
      </p>
    </div>
  );
}

import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PriceConverter } from "@/components/ui/price-converter";
import { SectionHeader } from "@/components/ui/section-header";
import { APP_CONFIG, APP_ROUTES } from "@/lib/config";
import { PLAN_CONTENT } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="precios" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[30rem] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08),transparent_65%)]" />
      <Container className="relative">
        <SectionHeader
          eyebrow="Planes simples"
          title="Empieza gratis. Crece cuando quieras."
          description="Publica una gran página sin pagar. Pasa a Pro cuando necesites más libertad, datos y personalización."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 lg:grid-cols-2 lg:items-stretch">
          <PricingCard
            name={PLAN_CONTENT.free.name}
            description={PLAN_CONTENT.free.description}
            price="$0"
            period="para siempre"
            features={PLAN_CONTENT.free.features}
            cta="Comenzar gratis"
            href={`${APP_ROUTES.signup}?fresh=1`}
          />
          <PricingCard
            name={PLAN_CONTENT.pro.name}
            description={PLAN_CONTENT.pro.description}
            price={APP_CONFIG.pricing.proMonthlyLabel}
            period={APP_CONFIG.pricing.proPeriod}
            features={PLAN_CONTENT.pro.features}
            cta="Obtener Pro"
            href={`${APP_ROUTES.signup}?plan=pro&fresh=1`}
            featured
            convertible
          />
        </div>
        <p className="mt-6 text-center text-xs text-[var(--muted)]">No necesitas tarjeta para comenzar con Free.</p>
      </Container>
    </section>
  );
}

type PricingCardProps = {
  name: string;
  description: string;
  price: string;
  period: string;
  features: readonly string[];
  cta: string;
  href: string;
  featured?: boolean;
  convertible?: boolean;
};

function PricingCard({
  name,
  description,
  price,
  period,
  features,
  cta,
  href,
  featured = false,
  convertible = false,
}: PricingCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${
        featured
          ? "border-violet-400/30 bg-[linear-gradient(145deg,rgba(124,58,237,0.14),var(--surface)_45%)] shadow-[0_28px_80px_rgba(75,38,150,0.16)]"
          : "border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)]"
      }`}
    >
      {featured && (
        <>
          <div className="absolute -right-20 -top-20 size-56 rounded-full bg-violet-500/15 blur-3xl" />
          <span className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--accent-text)] sm:right-7 sm:top-7">
            <Sparkles className="size-3" aria-hidden="true" /> Más libertad
          </span>
        </>
      )}
      <div className="relative">
        <div className="flex items-center gap-2">
          {featured && <Crown className="size-4 text-violet-500" aria-hidden="true" />}
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--foreground)]">{name}</h3>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
        <div className="mt-8">
          {convertible ? (
            <PriceConverter />
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-0.055em] text-[var(--foreground)]">{price}</span>
              <span className="mb-1.5 text-sm text-[var(--muted)]">{period}</span>
            </div>
          )}
        </div>
        <div className="my-8 h-px bg-[var(--border)]" />
        <ul className="space-y-3.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-[var(--foreground)]">
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${featured ? "bg-violet-400/12 text-violet-500" : "bg-[var(--subtle-hover)] text-[var(--muted)]"}`}>
                <Check className="size-3" aria-hidden="true" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <Button href={href} variant={featured ? "primary" : "secondary"} size="lg" className="mt-9 w-full">
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

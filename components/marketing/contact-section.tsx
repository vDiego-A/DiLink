import { Mail, MessageSquareText } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { Container } from "@/components/ui/container";
import { APP_CONFIG } from "@/lib/config";

export function ContactSection() {
  return (
    <section id="contacto" className="scroll-mt-24 pb-24 pt-8 sm:pb-32 sm:pt-12">
      <Container>
        <div className="mx-auto grid max-w-[1080px] overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-soft)] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-violet-500/10 blur-[70px]" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <span className="mb-7 grid size-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-[var(--accent-text)]">
                <MessageSquareText className="size-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-text)]">Contacto</p>
              <h2 className="section-title mt-4 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-4xl">
                Hablemos de lo que quieres crear.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                ¿Tienes alguna duda? Consúltame directamente o envíame un mensaje desde el formulario.
              </p>

              <a
                href={`mailto:${APP_CONFIG.contactEmail}`}
                className="mt-9 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)]"
              >
                <Mail className="size-4 text-violet-500" aria-hidden="true" />
                {APP_CONFIG.contactEmail}
              </a>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Send } from "lucide-react";
import { APP_CONFIG, APP_NAME } from "@/lib/config";

export function ContactForm() {
  const [status, setStatus] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("Completa todos los campos antes de enviar.");
      return;
    }

    const subject = encodeURIComponent(`Nuevo mensaje desde ${APP_NAME}`);
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`);

    setStatus("Abriendo tu aplicación de correo…");
    window.location.href = `mailto:${APP_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="contact-form-note contact-form-status">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="contact-name">
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Tu nombre"
            className="contact-field"
          />
        </Field>

        <Field label="Correo electrónico" htmlFor="contact-email">
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
            className="contact-field"
          />
        </Field>
      </div>

      <Field label="Mensaje" htmlFor="contact-message">
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder="Cuéntame cómo puedo ayudarte…"
          className="contact-field resize-y"
        />
      </Field>

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p id="contact-form-note" className="max-w-sm text-xs leading-5 text-[var(--muted-soft)]">
          Al enviar, se abrirá tu aplicación de correo con el mensaje preparado.
        </p>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-300/20 bg-[linear-gradient(135deg,#8b5cf6_0%,#6d4aff_48%,#2563eb_100%)] px-6 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(91,65,255,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(91,65,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          Enviar mensaje
          <Send className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p id="contact-form-status" role="status" aria-live="polite" className="min-h-5 text-sm font-medium text-[var(--accent-text)]">
        {status}
      </p>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}

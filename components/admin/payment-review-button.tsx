"use client";

import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, X } from "lucide-react";

export function PaymentReviewButton({ decision }: { decision: "approved" | "rejected" }) {
  const { pending } = useFormStatus();
  const approving = decision === "approved";

  return (
    <button
      type="submit"
      name="decision"
      value={decision}
      disabled={pending}
      className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold disabled:cursor-wait disabled:opacity-60 ${
        approving
          ? "bg-emerald-600 text-white hover:bg-emerald-500"
          : "border border-rose-400/25 bg-rose-400/[0.08] text-rose-500 hover:bg-rose-400/[0.13]"
      }`}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : approving ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <X className="size-4" aria-hidden="true" />
      )}
      {approving ? "Aprobar y activar Pro" : "Rechazar"}
    </button>
  );
}

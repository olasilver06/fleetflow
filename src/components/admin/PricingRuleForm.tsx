"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PricingRule = {
  id: string;
  baseFee: number;
  perKmRate: number | null;
  weightSurchargeRate: number | null;
  isActive: boolean;
};

export default function PricingRuleForm({
  zoneId,
  existingRule,
}: {
  zoneId: string;
  existingRule: PricingRule | null;
}) {
  const router = useRouter();
  const [baseFee, setBaseFee] = useState(existingRule ? String(existingRule.baseFee) : "");
  const [perKmRate, setPerKmRate] = useState(
    existingRule?.perKmRate != null ? String(existingRule.perKmRate) : ""
  );
  const [weightSurchargeRate, setWeightSurchargeRate] = useState(
    existingRule?.weightSurchargeRate != null ? String(existingRule.weightSurchargeRate) : ""
  );
  const [isActive, setIsActive] = useState(existingRule?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      baseFee: parseFloat(baseFee),
      perKmRate: perKmRate ? parseFloat(perKmRate) : null,
      weightSurchargeRate: weightSurchargeRate ? parseFloat(weightSurchargeRate) : null,
      isActive,
    };

    try {
      const res = existingRule
        ? await fetch(`/api/pricing-rules/${existingRule.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/pricing-rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ zoneId, ...payload }),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't save pricing rule. Try again.");
        setSubmitting(false);
        return;
      }

      router.refresh();
      setSubmitting(false);
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Base fee (₦)</label>
        <input
          type="number"
          step="any"
          value={baseFee}
          onChange={(e) => setBaseFee(e.target.value)}
          required
          disabled={submitting}
          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Per km (₦)</label>
        <input
          type="number"
          step="any"
          value={perKmRate}
          onChange={(e) => setPerKmRate(e.target.value)}
          disabled={submitting}
          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
      </div>
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Per kg (₦)</label>
        <input
          type="number"
          step="any"
          value={weightSurchargeRate}
          onChange={(e) => setWeightSurchargeRate(e.target.value)}
          disabled={submitting}
          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-text-secondary text-xs">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={submitting}
            className="rounded border-border accent-primary"
          />
          Active
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? "Saving…" : existingRule ? "Update" : "Add rule"}
        </button>
      </div>
      {errorMessage && (
        <p className="text-danger text-xs col-span-full" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

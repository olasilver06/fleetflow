"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't submit rating. Try again.");
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-3">
      <p className="text-text-secondary text-xs">Rate this delivery</p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            disabled={submitting}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className={`text-2xl leading-none disabled:opacity-40 ${
              value <= rating ? "text-warning" : "text-text-secondary"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={submitting}
        rows={2}
        className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-40"
      />

      {errorMessage && (
        <p className="text-danger text-sm" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={rating < 1 || submitting}
        className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}

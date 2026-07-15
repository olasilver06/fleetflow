import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { RiderAvailability } from "@prisma/client";

export const dynamic = "force-dynamic";

const AVAILABILITY_STYLES: Record<RiderAvailability, string> = {
  AVAILABLE: "bg-success/10 text-success",
  BUSY: "bg-accent/10 text-accent",
  OFFLINE: "bg-neutral/10 text-neutral",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-mono ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-text-primary text-sm">{value}</p>
    </div>
  );
}

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Account</h1>
        <p className="text-text-secondary mt-1">Your profile details.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-xl border border-border bg-surface p-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={currentUser.name} />
          <Field label="Email" value={currentUser.email} />
          <Field
            label="Role"
            value={<Badge label={currentUser.role} className="bg-primary/10 text-primary" />}
          />
        </div>

        {currentUser.role === "RIDER" && currentUser.rider && (
          <div className="rounded-xl border border-border bg-surface p-6 grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle type" value={currentUser.rider.vehicleType ?? "Not set"} />
            <Field label="License plate" value={currentUser.rider.licensePlate ?? "Not set"} />
            <Field
              label="Availability"
              value={
                <Badge
                  label={currentUser.rider.availability}
                  className={AVAILABILITY_STYLES[currentUser.rider.availability]}
                />
              }
            />
            <Field label="Completed deliveries" value={currentUser.rider.completedDeliveries} />
            <Field
              label="Average rating"
              value={
                currentUser.rider.averageRating != null
                  ? `${currentUser.rider.averageRating.toFixed(1)} / 5`
                  : "No ratings yet"
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}

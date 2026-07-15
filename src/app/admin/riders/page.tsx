import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import RiderVerificationControl from "@/components/admin/RiderVerificationControl";
import type { RiderAvailability, RiderVerificationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const AVAILABILITY_STYLES: Record<RiderAvailability, string> = {
  AVAILABLE: "bg-success/10 text-success",
  BUSY: "bg-accent/10 text-accent",
  OFFLINE: "bg-neutral/10 text-neutral",
};

const VERIFICATION_STYLES: Record<RiderVerificationStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
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

export default async function AdminRidersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }
  if (currentUser.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-text-secondary">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const riders = await prisma.rider.findMany({
    where: { deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Riders</h1>
        <p className="text-text-secondary mt-1">
          Everyone who has signed up as a rider. New riders are PENDING until manually
          approved below — they stay OFFLINE until they set themselves AVAILABLE.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {riders.length === 0 && (
          <p className="text-text-secondary">No riders have signed up yet.</p>
        )}

        {riders.map((rider) => (
          <div
            key={rider.id}
            className="rounded-xl border border-border bg-surface p-6 flex items-center justify-between gap-6"
          >
            <div>
              <p className="text-text-primary text-sm font-medium">{rider.user.name}</p>
              <p className="text-text-secondary text-xs mt-0.5">{rider.user.email}</p>
              <p className="text-text-secondary text-xs mt-1">
                {rider.vehicleType ?? "No vehicle type set"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  label={rider.verificationStatus}
                  className={VERIFICATION_STYLES[rider.verificationStatus]}
                />
                <Badge
                  label={rider.availability}
                  className={AVAILABILITY_STYLES[rider.availability]}
                />
              </div>
            </div>
            {rider.verificationStatus === "PENDING" && (
              <RiderVerificationControl riderId={rider.id} />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

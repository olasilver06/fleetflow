import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { formatNaira } from "@/lib/format";
import CreateZoneForm from "@/components/admin/CreateZoneForm";
import PricingRuleForm from "@/components/admin/PricingRuleForm";

export const dynamic = "force-dynamic";

export default async function AdminZonesPage() {
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

  const zones = await prisma.deliveryZone.findMany({
    include: { pricingRules: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Zones & pricing</h1>
        <p className="text-text-secondary mt-1">
          Manage delivery zones and their per-zone pricing rules.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-text-primary font-medium mb-4">New zone</h2>
          <CreateZoneForm />
        </div>

        <div className="space-y-4">
          {zones.length === 0 && (
            <p className="text-text-secondary">No zones yet — create one above.</p>
          )}

          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-primary font-medium">{zone.name}</p>
                  <p className="text-text-secondary text-xs mt-0.5">
                    Zone base fee: {formatNaira(zone.baseFee)}
                  </p>
                </div>
              </div>
              <PricingRuleForm zoneId={zone.id} existingRule={zone.pricingRules[0] ?? null} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { PackagePlus, Navigation, PackageCheck, MapPin, Camera, Ruler, History } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import FleetFlowLogo from "@/components/FleetFlowLogo";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    number: 1,
    title: "Request",
    description: "Tell us pickup and drop-off, get an instant price.",
    icon: PackagePlus,
  },
  {
    number: 2,
    title: "Track",
    description: "Watch your rider move on a live map in real time.",
    icon: Navigation,
  },
  {
    number: 3,
    title: "Confirmed",
    description: "Get photo proof the moment it's delivered.",
    icon: PackageCheck,
  },
];

const FEATURES = [
  {
    title: "Live GPS tracking",
    description: "A real-time map of your rider's position — not just a status label.",
    icon: MapPin,
  },
  {
    title: "Photo proof of delivery",
    description: "Required on every order before it can be marked delivered.",
    icon: Camera,
  },
  {
    title: "Transparent, distance-based pricing",
    description: "Price is calculated from the actual route — not an opaque flat rate.",
    icon: Ruler,
  },
  {
    title: "Every step logged",
    description: "Full delivery history and audit trail, visible to you from request to delivery.",
    icon: History,
  },
];

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="min-h-screen bg-background">
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <FleetFlowLogo className="w-90 h-auto mb-3" />
        <p className="text-text-secondary text-lg mb-8">
          Last-mile delivery, tracked in real time.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={currentUser ? "/request" : "/login"}
            className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Request a delivery
          </Link>
          <Link
            href="/join"
            className="rounded-lg border border-border px-6 py-3 text-text-primary font-medium hover:bg-surface transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-6 py-3 text-text-primary font-medium hover:bg-surface transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="border-t border-border px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-text-primary text-2xl font-medium text-center mb-10">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-mono text-sm">
                    {step.number}
                  </span>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-text-primary font-medium mb-1">{step.title}</p>
                <p className="text-text-secondary text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-text-primary text-2xl font-medium text-center mb-10">
            Why FleetFlow
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <feature.icon className="h-6 w-6 text-accent mb-4" />
                <p className="text-text-primary font-medium mb-1">{feature.title}</p>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

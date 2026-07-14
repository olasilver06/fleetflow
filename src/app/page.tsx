import Link from "next/link";
import Image from "next/image";
import {
  Bike,
  PackagePlus,
  Navigation,
  PackageCheck,
  MapPin,
  Camera,
  Ruler,
  History,
  Settings,
  Clock,
  CheckCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import FleetFlowLogo from "@/components/FleetFlowLogo";
import FleetFlowIconMark from "@/components/FleetFlowIconMark";
import AccountMenu from "@/components/home/AccountMenu";
import Footer from "@/components/Footer";

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
  const bottomCtaHref = currentUser?.role === "CUSTOMER" ? "/request" : "/login";

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
          <Link href="/">
            <FleetFlowLogo className="w-32 h-auto" />
          </Link>
          <div className="flex items-center gap-5">
            <Settings className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            <AccountMenu role={currentUser?.role ?? null} />
          </div>
        </div>
      </div>

      {/* Hero panel 1 — courier, full-bleed photo background */}
      <section className="relative mt-6 h-[440px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden">
        <Image
          src="/hero-rider.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="max-w-xl text-3xl font-semibold text-text-primary sm:text-4xl">
            Last-mile delivery, tracked in real time.
          </h1>
          <div className="flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm text-text-primary">
              <Navigation className="h-4 w-4 text-primary" />
              Fast, tracked last-mile flow
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
              <Clock className="h-4 w-4" />
              Live ETA updates, every rider, every stop
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm text-text-primary">
              <CheckCircle className="h-4 w-4 text-success" />
              Proof of delivery on every order
            </span>
          </div>
        </div>
      </section>

      {/* Hero panel 2 — warehouse/tracking, full-bleed photo background */}
      <section className="relative w-full overflow-hidden py-16 sm:py-20">
        <Image
          src="/hero-warehouse.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background/50" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-4">
          <div className="flex w-full flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/90 px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium text-text-primary">Tracking active</span>
            </div>
            <div className="rounded-lg bg-primary px-4 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-white sm:text-sm">
                Real-time visibility across every route
              </p>
            </div>
          </div>

          {/* Fixed light card — intentional contrast against the dark photo
              overlay, so its colors are pinned rather than theme tokens. */}
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Rider App · v2.1
            </div>
            <div className="mb-4 flex flex-col items-center justify-center rounded-xl bg-[#111827] py-8">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7A32]">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <p className="font-mono text-xs tracking-wide text-[#FF7A32]">IN TRANSIT</p>
            </div>
            <p className="mb-1 font-semibold text-gray-900">Route Tracking</p>
            <p className="text-sm text-gray-500">
              Live position, ETA, and proof-of-delivery for every rider on the road.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA bar */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href={bottomCtaHref}
          className="flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-5 text-white transition-colors hover:bg-primary/90"
        >
          <FleetFlowIconMark className="h-6 w-6" />
          <span className="text-lg font-bold tracking-wide">FLEETFLOW</span>
        </Link>
      </div>

      {/* 3. How it works */}
      <section id="how-it-works" className="border-t border-border px-4 py-16">
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

      {/* 4. Why FleetFlow */}
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

      {/* 5. Footer */}
      <Footer />
    </main>
  );
}

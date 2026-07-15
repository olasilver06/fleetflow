import Link from "next/link";
import Image from "next/image";
import { Package, Bike } from "lucide-react";
import FleetFlowLogo from "@/components/FleetFlowLogo";

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-10">
        <FleetFlowLogo className="w-35 h-auto" />
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-text-primary text-2xl font-medium mb-2">Join FleetFlow</h1>
        <p className="text-text-secondary">How would you like to get started?</p>
      </div>

      <div className="w-full max-w-2xl grid gap-6 sm:grid-cols-2">
        <Link
          href="/signup"
          className="group relative block h-64 overflow-hidden rounded-xl border border-border sm:h-72"
        >
          <Image
            src="/hero-warehouse.jpg"
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="relative z-10 flex h-full flex-col justify-end p-6">
            <Package className="h-8 w-8 text-primary mb-4" />
            <p className="text-text-primary font-medium text-lg mb-1">I need deliveries</p>
            <p className="text-text-secondary text-sm">
              Sign up as a customer to request and track deliveries.
            </p>
          </div>
        </Link>

        <Link
          href="/rider-signup"
          className="group relative block h-64 overflow-hidden rounded-xl border border-border sm:h-72"
        >
          <Image
            src="/hero-rider.jpg"
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="relative z-10 flex h-full flex-col justify-end p-6">
            <Bike className="h-8 w-8 text-accent mb-4" />
            <p className="text-text-primary font-medium text-lg mb-1">
              I want to ride for FleetFlow
            </p>
            <p className="text-text-secondary text-sm">
              Sign up as a rider and start accepting delivery jobs.
            </p>
          </div>
        </Link>
      </div>

      <Link
        href="/login"
        className="mt-8 text-text-secondary text-sm hover:text-text-primary transition-colors"
      >
        Already have an account? Sign in
      </Link>
    </main>
  );
}

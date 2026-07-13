import Link from "next/link";
import FleetFlowLogo from "@/components/FleetFlowLogo";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FleetFlowLogo className="w-32 h-auto mb-3" />
            <p className="text-text-secondary text-sm">
              Last-mile delivery, tracked in real time.
            </p>
          </div>

          <div>
            <p className="text-text-primary text-sm font-medium mb-3">Product</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Track an order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-text-primary text-sm font-medium mb-3">Company</p>
            <ul className="space-y-2">
              <li className="text-text-secondary text-sm">About</li>
              <li className="text-text-secondary text-sm">Contact</li>
            </ul>
          </div>

          <div>
            <p className="text-text-primary text-sm font-medium mb-3">Get started</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/join"
                  className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/rider-signup"
                  className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Become a rider
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-text-secondary text-xs">© 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

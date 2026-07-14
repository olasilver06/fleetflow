import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import OrderRequestForm from "@/components/customer/OrderRequestForm";

export const dynamic = "force-dynamic";

export default async function RequestDeliveryPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }
  if (currentUser.role !== "CUSTOMER" || !currentUser.customer) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-text-secondary">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Request a delivery</h1>
        <p className="text-text-secondary mt-1">
          Tell us where it&apos;s going, and we&apos;ll get a rider on it.
        </p>
      </div>
      <OrderRequestForm />
    </main>
  );
}

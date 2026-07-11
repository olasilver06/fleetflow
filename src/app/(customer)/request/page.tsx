import OrderRequestForm from "@/components/customer/OrderRequestForm";
import CustomerNav from "@/components/customer/CustomerNav";

export default function RequestDeliveryPage() {
  return (
    <>
      <CustomerNav />
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-text-primary text-2xl font-medium">Request a delivery</h1>
          <p className="text-text-secondary mt-1">
            Tell us where it&apos;s going, and we&apos;ll get a rider on it.
          </p>
        </div>
        <OrderRequestForm />
      </main>
    </>
  );
}

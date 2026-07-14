import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderNumber = request.nextUrl.searchParams.get("orderNumber")?.trim();
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { delivery: true },
  });

  // A wrong/unauthorized order number both come back 404 — a 403 here would
  // confirm to a stranger that the order number they guessed actually exists.
  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authorized =
    user.role === "ADMIN" ||
    (user.role === "CUSTOMER" && !!user.customer && order.customerId === user.customer.id) ||
    (user.role === "RIDER" && !!user.rider && order.delivery?.riderId === user.rider.id);

  if (!authorized) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ id: order.id });
}

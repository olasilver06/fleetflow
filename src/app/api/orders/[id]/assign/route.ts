import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assignRiderToOrder } from "@/lib/services/order-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;
  const body = await request.json();
  const riderId = typeof body?.riderId === "string" ? body.riderId : null;

  if (!riderId) {
    return NextResponse.json({ error: "riderId is required" }, { status: 400 });
  }

  try {
    const order = await assignRiderToOrder(orderId, riderId, user.id);
    return NextResponse.json(order);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't assign rider";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

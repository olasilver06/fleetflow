import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const VALID_STATUSES = ["APPROVED", "REJECTED"];

export async function PATCH(
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

  const { id: riderId } = await params;
  const body = await request.json();
  const status = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be one of APPROVED, REJECTED" },
      { status: 400 }
    );
  }

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider || rider.deletedAt) {
    return NextResponse.json({ error: "Rider not found" }, { status: 404 });
  }

  // updatedAt (auto-managed by Prisma) is the audit trail for this field —
  // riders don't have a dedicated history table like OrderStatusHistory, and
  // adding one for a single status field would be over-engineering for what
  // this needs right now.
  const updated = await prisma.rider.update({
    where: { id: riderId },
    data: { verificationStatus: status as "APPROVED" | "REJECTED" },
  });

  return NextResponse.json(updated);
}

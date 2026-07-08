import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { transitionOrderStatusInTx } from "@/lib/services/order-service";

const PROOF_BUCKET = "proof-of-delivery";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (user.role === "RIDER") {
    if (!user.rider || order.delivery?.riderId !== user.rider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!order.delivery) {
    return NextResponse.json({ error: "Order has no delivery" }, { status: 409 });
  }
  const deliveryId = order.delivery.id;

  if (order.status !== "IN_TRANSIT") {
    return NextResponse.json(
      { error: "Order must be IN_TRANSIT to submit proof of delivery" },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const recipientName = formData.get("recipientName");
  const notes = formData.get("notes");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "photo is required" }, { status: 400 });
  }

  const extension = photo.name.includes(".") ? photo.name.split(".").pop() : "jpg";
  const path = `${orderId}-${Date.now()}.${extension}`;

  const admin = createSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from(PROOF_BUCKET)
    .upload(path, photo, { contentType: photo.type || undefined });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PROOF_BUCKET).getPublicUrl(path);

  try {
    const [proof, updatedOrder] = await prisma.$transaction(async (tx) => {
      const proof = await tx.proofOfDelivery.create({
        data: {
          deliveryId,
          photoUrl: publicUrl,
          recipientName:
            typeof recipientName === "string" && recipientName.trim()
              ? recipientName.trim()
              : null,
          notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        },
      });

      await tx.delivery.update({
        where: { id: deliveryId },
        data: { deliveredAt: new Date() },
      });

      const updatedOrder = await transitionOrderStatusInTx(
        tx,
        orderId,
        "DELIVERED",
        user.id
      );

      return [proof, updatedOrder] as const;
    });

    return NextResponse.json({ proof, order: updatedOrder }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't record proof of delivery";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

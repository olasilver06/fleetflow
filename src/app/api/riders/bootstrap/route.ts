import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_VEHICLE_TYPES = ["BIKE", "VAN", "TRUCK"];

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: { rider: true },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const vehicleType = typeof body?.vehicleType === "string" ? body.vehicleType : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!vehicleType || !VALID_VEHICLE_TYPES.includes(vehicleType)) {
    return NextResponse.json(
      { error: "vehicleType must be one of BIKE, VAN, TRUCK" },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email: authUser.email!,
      name,
      role: "RIDER",
      rider: {
        create: {
          vehicleType: vehicleType as "BIKE" | "VAN" | "TRUCK",
          availability: "OFFLINE",
          verificationStatus: "PENDING",
        },
      },
    },
    include: { rider: true },
  });

  return NextResponse.json(user, { status: 201 });
}

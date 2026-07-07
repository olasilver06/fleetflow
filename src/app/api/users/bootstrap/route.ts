import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    include: { customer: true },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email: authUser.email!,
      name,
      role: "CUSTOMER",
      customer: { create: {} },
    },
    include: { customer: true },
  });

  return NextResponse.json(user, { status: 201 });
}

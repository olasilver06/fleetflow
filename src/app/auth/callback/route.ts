import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const existing = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });

  // No row yet — brand-new Google sign-up. We don't know their intended
  // role (customer vs rider) or confirmed name, so don't create anything
  // here; /complete-profile collects that first.
  if (!existing) {
    return NextResponse.redirect(`${origin}/complete-profile`);
  }

  // A soft-deleted row signing back in via Google gets the same "no
  // access" treatment as any other deleted account elsewhere in the app.
  if (existing.deletedAt) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Returning user — same role-based landing logic as email/password login.
  const destination =
    existing.role === "ADMIN"
      ? "/admin/dashboard"
      : existing.role === "RIDER"
        ? "/rider/jobs"
        : "/request";
  return NextResponse.redirect(`${origin}${destination}`);
}

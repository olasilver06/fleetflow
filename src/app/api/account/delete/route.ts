import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { deletedAt: now } });
    if (user.customer) {
      await tx.customer.update({ where: { id: user.customer.id }, data: { deletedAt: now } });
    }
    if (user.rider) {
      await tx.rider.update({ where: { id: user.rider.id }, data: { deletedAt: now } });
    }
  });

  // Ban the Supabase identity rather than hard-deleting it — the reversible
  // equivalent of this app's soft-delete convention (CLAUDE.md), applied to
  // the one piece of the account Prisma doesn't own. We deliberately don't
  // call auth.admin.deleteUser(), which would be irreversible.
  // getCurrentUser() already rejects deletedAt rows above, so even if this
  // ban call fails, the account is already locked out at the app level —
  // there's no notification system yet to alert an admin if it does fail,
  // so we just log it rather than rolling back the soft-delete.
  try {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.updateUserById(user.supabaseId, { ban_duration: "876000h" });
  } catch (error) {
    console.error("Failed to ban Supabase auth user after account deletion", error);
  }

  return NextResponse.json({ success: true });
}

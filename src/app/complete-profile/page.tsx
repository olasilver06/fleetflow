import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CompleteProfileForm from "@/components/CompleteProfileForm";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const existing = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });

  if (existing) {
    // Already has a FleetFlow row — nothing to complete. A soft-deleted
    // row gets the same "no access" treatment as everywhere else; a live
    // row just goes to its normal landing page.
    if (existing.deletedAt) {
      redirect("/login");
    }
    redirect(
      existing.role === "ADMIN"
        ? "/admin/dashboard"
        : existing.role === "RIDER"
          ? "/rider/jobs"
          : "/request"
    );
  }

  const suggestedName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : "";

  return <CompleteProfileForm defaultName={suggestedName} />;
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Distinguishes "the DB was unreachable" from "genuinely not logged in"
// (getCurrentUser returning null) — callers that want to tell these apart
// (e.g. to retry or show a different message) can check for this type.
export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Database temporarily unreachable while resolving the current user");
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabaseId },
    include: { customer: true, rider: true },
  });
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // The pooler connection has failed transiently but recoverably throughout
  // testing — one short retry avoids surfacing a hard failure for what's
  // usually a momentary blip, without masking a genuine outage.
  let user;
  try {
    user = await findUserBySupabaseId(authUser.id);
  } catch (firstError) {
    await sleep(300);
    try {
      user = await findUserBySupabaseId(authUser.id);
    } catch (retryError) {
      throw new DatabaseUnavailableError(retryError ?? firstError);
    }
  }

  if (!user || user.deletedAt) return null;

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function requireRole(role: "CUSTOMER" | "ADMIN" | "RIDER") {
  const user = await requireUser();
  if (user.role !== role) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

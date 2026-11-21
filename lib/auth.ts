import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { logDatabaseError } from "@/lib/errors";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    if (error) logDatabaseError(error, error.code);
    redirect("/login");
  }

  return data.user;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    logDatabaseError(error, error.code);
    return null;
  }

  return data.role === "manager" || data.role === "member" ? data.role : null;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  const actualRole = await getUserRole(user.id);

  if (actualRole !== role) {
    if (actualRole) redirect(`/${actualRole}`);
    redirect("/login");
  }

  return user;
}

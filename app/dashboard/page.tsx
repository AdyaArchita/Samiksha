import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  const role = (profile as Pick<Profile, "role"> | null)?.role;
  if (role === "manager") redirect("/manager");
  if (role === "member") redirect("/member");
  redirect("/login");
}

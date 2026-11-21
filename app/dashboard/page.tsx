import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getUserRole, requireUser } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/ui/skeletons";

async function DashboardRedirect() {
  await connection();
  const user = await requireUser();
  const role = await getUserRole(user.id);

  if (role === "manager") redirect("/manager");
  if (role === "member") redirect("/member");
  redirect("/login");
  return null;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardRedirect />
      </Suspense>
    </main>
  );
}

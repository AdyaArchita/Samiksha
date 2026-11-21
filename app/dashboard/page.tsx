import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserRole, requireUser } from "@/lib/auth";

async function DashboardRedirect() {
  const user = await requireUser();
  const role = await getUserRole(user.id);

  if (role === "manager") redirect("/manager");
  if (role === "member") redirect("/member");
  redirect("/login");
  return null;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <Suspense
        fallback={
          <div className="mx-auto h-16 max-w-5xl animate-pulse rounded-lg bg-zinc-200" />
        }
      >
        <DashboardRedirect />
      </Suspense>
    </main>
  );
}

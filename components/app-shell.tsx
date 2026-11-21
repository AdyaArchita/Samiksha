import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/lib/types";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

const roleLabels: Record<UserRole, string> = {
  manager: "Manager",
  member: "Member",
};

export function AppShell({
  title,
  role,
  children,
}: {
  title: ReactNode;
  role?: UserRole;
  children: ReactNode;
}) {
  const roleLabel = role ? roleLabels[role] : "Workspace";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href={role ? `/${role}` : "/dashboard"}
            aria-label="Skylent Tasks home"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-sm font-bold text-white">
              ST
            </span>
            <span className="truncate font-semibold tracking-tight text-foreground">
              Skylent Tasks
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted sm:inline-flex">
              {roleLabel}
            </span>
            <details className="relative">
              <summary aria-label="Open account menu" className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
                <span className="grid size-6 place-items-center rounded-full bg-background text-xs font-bold text-foreground" aria-hidden="true">
                  {role === "manager" ? "M" : role === "member" ? "U" : "A"}
                </span>
                <span className="hidden sm:inline">Account</span>
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-border bg-surface p-3 shadow-lg">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {role ? `${roleLabel} account` : "Account"}
                </p>
                <form action={signOut}>
                  <Button variant="ghost" className="w-full justify-start">
                    Sign out
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:hidden">
          <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted">
            {roleLabel}
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}

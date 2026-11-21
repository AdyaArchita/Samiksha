import { signOut } from "@/app/actions/auth";
import type { ReactNode } from "react";

export function AppShell({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Samiksha</p>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <form action={signOut}>
            <button className="rounded-md border px-3 py-2 text-sm">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { login, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function LoginForm({ errorSlot }: { errorSlot?: ReactNode }) {
  const [state, action] = useActionState<AuthActionState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="w-full space-y-5 rounded-2xl border border-border bg-surface p-7 shadow-lg sm:p-8">
      <div>
        <p className="text-sm font-semibold text-muted">Skylent Tasks</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Access your assigned work or managed tasks.</p>
      </div>
      <div className="min-h-11">
        {state?.error ? (
          <Toast variant="error">{state.error}</Toast>
        ) : errorSlot}
      </div>
      <label className="block text-sm font-semibold text-foreground">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" />
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" />
      </label>
      <Button pendingLabel="Signing in..." className="w-full">Sign in</Button>
      <a href="/signup" className="block rounded text-center text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">Create an account</a>
    </form>
  );
}

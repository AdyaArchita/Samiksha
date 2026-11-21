"use client";

import { useActionState } from "react";
import { signup, type AuthActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function SignupForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(
    signup,
    undefined,
  );

  return (
    <form action={action} className="w-full space-y-5 rounded-2xl border border-border bg-surface p-7 shadow-lg sm:p-8">
      <div>
        <p className="text-sm font-semibold text-muted">Skylent Tasks</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Create account</h1>
        <p className="mt-1 text-sm text-muted">New accounts start as members.</p>
        <p className="mt-1 text-xs text-muted">Managers are promoted using the documented database setup step.</p>
      </div>
      {state?.error && (
        <Toast variant="error">{state.error}</Toast>
      )}
      <label className="block text-sm font-semibold text-foreground">
        Full name
        <input name="fullName" autoComplete="name" required minLength={2} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      </label>
      <label className="block text-sm font-semibold text-foreground">
        Password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      </label>
      <Button pendingLabel="Creating account..." className="w-full">Create account</Button>
      <a href="/login" className="block rounded text-center text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Already have an account?</a>
    </form>
  );
}

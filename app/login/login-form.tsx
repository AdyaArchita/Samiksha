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
    <form action={action} className="w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/60 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-indigo-700">Skylent Tasks</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access your assigned work or managed tasks.</p>
      </div>
      <div className="min-h-11">
        {state?.error ? (
          <Toast variant="error">{state.error}</Toast>
        ) : errorSlot}
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      </label>
      <Button pendingLabel="Signing in..." className="w-full">Sign in</Button>
      <a href="/signup" className="block rounded text-center text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Create an account</a>
    </form>
  );
}

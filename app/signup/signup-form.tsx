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
    <form action={action} className="w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/60 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-indigo-700">Skylent Tasks</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">New accounts start as members.</p>
        <p className="mt-1 text-sm text-slate-500">Managers are promoted using the documented database setup step.</p>
      </div>
      {state?.error && (
        <Toast variant="error">{state.error}</Toast>
      )}
      <label className="block text-sm font-semibold text-slate-700">
        Full name
        <input name="fullName" autoComplete="name" required minLength={2} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      </label>
      <Button pendingLabel="Creating account..." className="w-full">Create account</Button>
      <a href="/login" className="block rounded text-center text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Already have an account?</a>
    </form>
  );
}

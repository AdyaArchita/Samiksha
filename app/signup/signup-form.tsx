"use client";

import { useActionState } from "react";
import { signup, type AuthActionState } from "@/app/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    signup,
    undefined,
  );

  return (
    <form action={action} className="w-full space-y-4 rounded-xl border p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-amber-700">New accounts start as members. Promote managers using the documented SQL setup step.</p>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      )}
      <label className="block text-sm font-medium">
        Full name
        <input name="fullName" required minLength={2} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <button disabled={pending} className="w-full rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50">
        {pending ? "Creating account..." : "Create account"}
      </button>
      <a href="/login" className="block text-center text-sm text-blue-700">Already have an account?</a>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { login, type AuthActionState } from "@/app/actions/auth";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="w-full space-y-4 rounded-xl border p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">Access your assigned work or managed tasks.</p>
      </div>
      {(state?.error ?? initialError) && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state?.error ?? initialError}
        </p>
      )}
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input name="password" type="password" required className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <button disabled={pending} className="w-full rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50">
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <a href="/signup" className="block text-center text-sm text-blue-700">Create an account</a>
    </form>
  );
}

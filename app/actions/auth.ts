"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { friendlyPostgresError, logDatabaseError } from "@/lib/errors";
import { loginSchema, signupSchema } from "@/lib/validation";

export type AuthActionState = { error?: string } | undefined;

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logDatabaseError(error, error.code);
    return { error: friendlyPostgresError(error) };
  }

  redirect("/dashboard");
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Check the name, email, and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });
  if (error) {
    logDatabaseError(error, error.code);
    return { error: friendlyPostgresError(error) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    logDatabaseError(error, error.code);
    redirect(`/login?error=${encodeURIComponent(friendlyPostgresError(error))}`);
  }
  redirect("/login");
}

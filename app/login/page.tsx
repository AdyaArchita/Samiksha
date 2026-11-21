import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { Toast } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

async function LoginErrorSlot({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const message = getLoginErrorMessage(Array.isArray(error) ? error[0] : error);
  if (!message) return null;

  return <Toast variant="error">{message}</Toast>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center bg-background px-6">
      <LoginForm
        errorSlot={
          <Suspense fallback={null}>
            <LoginErrorSlot searchParams={searchParams} />
          </Suspense>
        }
      />
    </main>
  );
}

import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { getLoginErrorMessage } from "@/lib/auth-errors";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

async function LoginErrorSlot({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const message = getLoginErrorMessage(Array.isArray(error) ? error[0] : error);
  if (!message) return null;

  return (
    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
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

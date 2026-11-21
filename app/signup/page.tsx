import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center bg-background px-6">
      <SignupForm />
    </main>
  );
}

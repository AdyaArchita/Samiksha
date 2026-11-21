import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          This page may have moved or is no longer available.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}

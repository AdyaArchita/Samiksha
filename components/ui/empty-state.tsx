import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
  action,
  variant = "empty",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  variant?: "empty" | "error";
}) {
  return (
    <div
      className={`rounded-xl border border-dashed bg-white px-6 py-10 text-center shadow-sm ${
        variant === "error" ? "border-rose-200" : "border-slate-300"
      }`}
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

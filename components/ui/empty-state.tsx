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
      className={`rounded-xl border border-dashed bg-surface px-6 py-10 text-center shadow-sm ${
        variant === "error" ? "border-danger" : "border-border"
      }`}
    >
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

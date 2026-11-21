import type { ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

const styles: Record<ToastVariant, string> = {
  success: "border-status-approved-ring bg-status-approved-bg text-status-approved-fg",
  error: "border-danger bg-surface text-danger",
  info: "border-border bg-surface text-foreground",
};

export function Toast({
  variant,
  title,
  children,
}: {
  variant: ToastVariant;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`rounded-lg border p-3 text-sm ${styles[variant]}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

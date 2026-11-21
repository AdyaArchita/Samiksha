import type { ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

const styles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-indigo-200 bg-indigo-50 text-indigo-900",
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

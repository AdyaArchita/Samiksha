import type { TaskStatus } from "@/lib/types";

const statusStyles: Record<TaskStatus, string> = {
  assigned: "bg-sky-50 text-sky-800 ring-sky-600/20",
  submitted: "bg-amber-50 text-amber-800 ring-amber-600/20",
  changes_requested: "bg-rose-50 text-rose-800 ring-rose-600/20",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
};

const dotStyles: Record<TaskStatus, string> = {
  assigned: "bg-sky-500",
  submitted: "bg-amber-500",
  changes_requested: "bg-rose-500",
  approved: "bg-emerald-500",
};

const labels: Record<TaskStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  approved: "Approved",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}

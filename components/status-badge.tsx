import type { TaskStatus } from "@/lib/types";

const labels: Record<TaskStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

const styles: Record<TaskStatus, string> = {
  assigned: "bg-zinc-100 text-zinc-700",
  submitted: "bg-blue-100 text-blue-800",
  changes_requested: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

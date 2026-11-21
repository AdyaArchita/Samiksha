import type { TaskStatus } from "@/lib/types";

const statusStyles: Record<TaskStatus, string> = {
  assigned: "bg-status-assigned-bg text-status-assigned-fg ring-status-assigned-ring",
  submitted: "bg-status-submitted-bg text-status-submitted-fg ring-status-submitted-ring",
  changes_requested: "bg-status-changes-bg text-status-changes-fg ring-status-changes-ring",
  approved: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
};

const dotStyles: Record<TaskStatus, string> = {
  assigned: "bg-status-assigned-fg",
  submitted: "bg-status-submitted-fg",
  changes_requested: "bg-status-changes-fg",
  approved: "bg-status-approved-fg",
};

const labels: Record<TaskStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

export function StatusBadge({
  status,
  label,
}: {
  status: TaskStatus;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotStyles[status]}`} />
      {label ?? labels[status]}
    </span>
  );
}

import Link from "next/link";
import type { Task } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function TaskCard({
  task,
  href,
  today,
  assigneeName,
}: {
  task: Task;
  href: string;
  today: string;
  assigneeName?: string;
}) {
  const overdue =
    task.status !== "approved"
    && task.due_date
    && task.due_date < today;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-semibold text-foreground">
          {task.title}
        </h3>
        <StatusBadge status={task.status} />
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
        {task.instructions}
      </p>
      {assigneeName && (
        <p className="mt-3 text-xs font-medium text-muted">
          Assigned to {assigneeName}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-xs">
        <span className={`tabular ${overdue ? "font-medium text-danger" : "text-muted"}`}>
          {task.due_date ? `Due ${task.due_date}` : "No due date"}
        </span>
        {overdue && <span className="font-medium text-danger">Overdue</span>}
        {task.status === "changes_requested" && (
          <span className="font-semibold text-status-changes-fg">Feedback waiting</span>
        )}
      </div>
    </Link>
  );
}

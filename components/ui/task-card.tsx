import Link from "next/link";
import type { Task } from "@/lib/types";
import { formatRelativeTime, getTaskDueInfo } from "@/lib/task-presentation";
import { StatusBadge } from "./status-badge";

export function TaskCard({
  task,
  href,
  today,
  now,
  assigneeName,
  assigneeEmail,
}: {
  task: Task;
  href: string;
  today: string;
  now: string;
  assigneeName?: string;
  assigneeEmail?: string;
}) {
  const dueInfo = getTaskDueInfo(task.due_date, task.status, today);
  const updatedRelativeTime = task.updated_at
    ? formatRelativeTime(task.updated_at, now)
    : null;

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
      <div className="mt-auto space-y-3 pt-5">
        {(assigneeName || assigneeEmail) && (
          <div className="text-xs">
            {assigneeName ? (
              <>
                <p className="font-medium text-foreground">Assigned to {assigneeName}</p>
                {assigneeEmail && <p className="mt-0.5 text-muted">{assigneeEmail}</p>}
              </>
            ) : (
              <p className="font-medium text-muted">Assigned to {assigneeEmail}</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5">
            {dueInfo.formattedDate ? (
              <>
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <rect
                    x="2.25"
                    y="3.5"
                    width="11.5"
                    height="10"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                  <path
                    d="M5 2.25v2.5M11 2.25v2.5M2.5 6.25h11"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.25"
                  />
                </svg>
                <span className={`tabular ${dueInfo.overdue ? "font-medium text-danger" : "text-muted"}`}>
                  Due {dueInfo.formattedDate}
                </span>
              </>
            ) : (
              <span className="text-muted">No due date</span>
            )}
          </span>
          {dueInfo.relativeLabel && (
            <span className={dueInfo.overdue ? "font-medium text-danger" : "text-muted"}>
              {dueInfo.relativeLabel}
            </span>
          )}
        </div>
        {updatedRelativeTime && (
          <p className="text-xs text-muted">Updated {updatedRelativeTime}</p>
        )}
        {task.status === "changes_requested" && (
          <p className="text-xs font-semibold text-status-changes-fg">Feedback waiting</p>
        )}
      </div>
    </Link>
  );
}

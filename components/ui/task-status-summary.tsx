import Link from "next/link";
import type { TaskStatus } from "@/lib/types";
import {
  buildTaskListHref,
  type TaskFilter,
  type TaskSort,
} from "@/lib/task-presentation";
import { StatusBadge } from "./status-badge";

const statuses: TaskStatus[] = [
  "assigned",
  "submitted",
  "changes_requested",
  "approved",
];

export function TaskStatusSummary({
  pathname,
  counts,
  selected,
  query,
  sort,
}: {
  pathname: string;
  counts: Record<TaskStatus, number>;
  selected: TaskFilter;
  query: string;
  sort: TaskSort;
}) {
  return (
    <section aria-label="Task counts by status" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statuses.map((status) => {
        const href = buildTaskListHref(pathname, { status, query, sort });
        const active = selected === status;
        return (
          <Link
            key={status}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border p-4 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              active
                ? "border-accent bg-surface"
                : "border-border bg-surface hover:border-slate-300"
            }`}
          >
            <StatusBadge status={status} />
            <p className="tabular mt-2 text-2xl font-semibold text-foreground">
              {counts[status]}
            </p>
          </Link>
        );
      })}
    </section>
  );
}

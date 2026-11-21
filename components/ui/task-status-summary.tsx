import Link from "next/link";
import type { TaskStatus } from "@/lib/types";
import type { TaskFilter } from "@/lib/task-presentation";
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
}: {
  pathname: string;
  counts: Record<TaskStatus, number>;
  selected: TaskFilter;
}) {
  return (
    <section aria-label="Task counts by status" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statuses.map((status) => {
        const href = `${pathname}?status=${status}`;
        const active = selected === status;
        return (
          <Link
            key={status}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border p-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              active
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface hover:border-muted"
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

export function TaskFilterTabs({
  pathname,
  selected,
}: {
  pathname: string;
  selected: TaskFilter;
}) {
  const filters: {
    value: TaskFilter;
    label?: string;
    status?: TaskStatus;
  }[] = [
    { value: "all", label: "All tasks" },
    ...statuses.map((status) => ({ value: status, status })),
  ];

  return (
    <nav aria-label="Task status filters" className="flex flex-wrap gap-2">
      {filters.map(({ value, label, status }) => (
        <Link
          key={value}
          href={value === "all" ? pathname : `${pathname}?status=${value}`}
          aria-current={selected === value ? "page" : undefined}
          className={`inline-flex min-h-9 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
            selected === value ? "ring-2 ring-accent ring-offset-2" : ""
          }`}
        >
          {status ? (
            <StatusBadge status={status} />
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                selected === value
                  ? "bg-accent text-white"
                  : "bg-surface text-muted ring-1 ring-inset ring-border hover:bg-background"
              }`}
            >
              {label}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

import Link from "next/link";
import type { TaskStatus } from "@/lib/types";
import type { TaskFilter } from "@/lib/task-presentation";

const statusLabels: Record<TaskStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  approved: "Approved",
};

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
      {Object.entries(statusLabels).map(([status, label]) => {
        const filter = status as TaskStatus;
        const href = `${pathname}?status=${filter}`;
        const active = selected === filter;
        return (
          <Link
            key={filter}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border p-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              active
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-indigo-200"
            }`}
          >
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{counts[filter]}</p>
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
  const filters: { value: TaskFilter; label: string }[] = [
    { value: "all", label: "All tasks" },
    ...Object.entries(statusLabels).map(([value, label]) => ({
      value: value as TaskStatus,
      label,
    })),
  ];

  return (
    <nav aria-label="Task status filters" className="flex flex-wrap gap-2">
      {filters.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "all" ? pathname : `${pathname}?status=${value}`}
          aria-current={selected === value ? "page" : undefined}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            selected === value
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

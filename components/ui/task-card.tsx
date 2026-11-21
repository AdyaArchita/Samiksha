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
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-semibold text-slate-900 group-hover:text-indigo-700">
          {task.title}
        </h3>
        <StatusBadge status={task.status} />
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
        {task.instructions}
      </p>
      {assigneeName && (
        <p className="mt-3 text-xs font-medium text-slate-500">
          Assigned to {assigneeName}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-sm">
        <span className={overdue ? "font-medium text-rose-700" : "text-slate-500"}>
          {task.due_date ? `Due ${task.due_date}` : "No due date"}
          {overdue && " · Overdue"}
        </span>
        {task.status === "changes_requested" && (
          <span className="font-semibold text-rose-700">Feedback waiting</span>
        )}
      </div>
    </Link>
  );
}

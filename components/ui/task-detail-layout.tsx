import Link from "next/link";
import type { ReactNode } from "react";
import { TaskTimeline } from "./task-timeline";
import type { TaskHistoryEvent } from "@/lib/task-presentation";
import type { UserRole } from "@/lib/types";

export function TaskDetailLayout({
  role,
  history,
  historyError,
  children,
  actions,
}: {
  role: UserRole;
  history: TaskHistoryEvent[];
  historyError: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Link
        href={`/${role}`}
        className="inline-flex min-h-9 items-center rounded text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden="true" className="mr-2">←</span>
        Back to {role === "manager" ? "manager dashboard" : "my tasks"}
      </Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div className="min-w-0 space-y-5">{children}</div>
        <div className="min-w-0 lg:sticky lg:top-28">
          <TaskTimeline events={history} error={historyError} />
        </div>
      </div>
      {actions}
    </div>
  );
}

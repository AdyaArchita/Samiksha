import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { TaskCard } from "@/components/ui/task-card";
import { TaskStatusSummary } from "@/components/ui/task-status-summary";
import { requireRole } from "@/lib/auth";
import {
  countTaskStatuses,
  filterTasks,
  parseTaskFilter,
  sortTasks,
} from "@/lib/task-presentation";
import type { Task } from "@/lib/types";

type MemberPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

async function MemberTaskList({ searchParams }: MemberPageProps) {
  await connection();
  const { status } = await searchParams;
  const filter = parseTaskFilter(status);
  const user = await requireRole("member");
  const supabase = await createSupabaseServerClient();
  const { data: tasksData, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false });

  if (error) logDatabaseError(error, error.code);
  const tasks = (tasksData ?? []) as Task[];
  const displayName =
    typeof user.user_metadata?.full_name === "string"
    && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : "there";
  const today = new Date().toISOString().slice(0, 10);
  const counts = countTaskStatuses(tasks);
  const visibleTasks = filterTasks(sortTasks(tasks, "member"), filter);

  return (
    <div className="space-y-7">
      <section>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Welcome back, {displayName}</h2>
        <p className="mt-1 text-sm text-muted">Your work and review feedback, all in one place.</p>
      </section>

      {error ? (
        <EmptyState title="Your tasks could not be loaded" variant="error">
          Refresh the page to try again.
        </EmptyState>
      ) : (
        <>
          <TaskStatusSummary
            pathname="/member"
            counts={counts}
            selected={filter}
          />
          <section aria-labelledby="member-tasks-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="member-tasks-heading" className="text-lg font-semibold text-foreground">
                  Your assignments
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Tasks needing your attention are shown first.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="tabular text-xs text-muted">
                  {visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}
                </p>
                {filter !== "all" && (
                  <Link
                    href="/member"
                    className="rounded text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    Show all tasks
                  </Link>
                )}
              </div>
            </div>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks assigned yet">
                New tasks assigned to you will appear here.
              </EmptyState>
            ) : visibleTasks.length === 0 ? (
              <EmptyState title="No tasks in this status">
                Choose another status filter to see more tasks.
              </EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    href={`/member/tasks/${task.id}`}
                    today={today}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function MemberPage(props: MemberPageProps) {
  return (
    <AppShell title="My tasks" role="member">
      <Suspense fallback={<DashboardSkeleton />}>
        <MemberTaskList searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors";
import { AppShell } from "@/components/app-shell";
import { CreateTaskForm } from "./create-task-form";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { TaskCard } from "@/components/ui/task-card";
import { TaskListControls } from "@/components/ui/task-list-controls";
import { TaskStatusSummary } from "@/components/ui/task-status-summary";
import { requireRole } from "@/lib/auth";
import {
  buildTaskListHref,
  countTaskStatuses,
  filterTasks,
  filterTasksByQuery,
  parseTaskFilter,
  parseTaskSort,
  sortTaskList,
} from "@/lib/task-presentation";
import type { Profile, Task } from "@/lib/types";

export const metadata: Metadata = {
  title: "Manager dashboard",
};

type ManagerPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
    sort?: string | string[];
  }>;
};

async function ManagerDashboard({ searchParams }: ManagerPageProps) {
  await connection();
  const { status, q, sort: sortValue } = await searchParams;
  const filter = parseTaskFilter(status);
  const query = (Array.isArray(q) ? q[0] ?? "" : q ?? "").trim();
  const sort = parseTaskSort(sortValue);
  const user = await requireRole("manager");
  const supabase = await createSupabaseServerClient();

  const [tasksResult, membersResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("role", "member")
      .order("full_name"),
  ]);
  if (tasksResult.error) logDatabaseError(tasksResult.error, tasksResult.error.code);
  if (membersResult.error) logDatabaseError(membersResult.error, membersResult.error.code);
  const tasks = (tasksResult.data ?? []) as Task[];
  const members = (membersResult.data ?? []) as Profile[];
  const now = new Date().toISOString();
  const displayName =
    typeof user.user_metadata?.full_name === "string"
    && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : "there";
  const membersById = new Map(members.map((member) => [member.id, member]));
  const assigneeTerms = new Map(
    members.map((member) => [
      member.id,
      `${member.full_name} ${member.email}`,
    ]),
  );
  const counts = countTaskStatuses(tasks);
  const visibleTasks = sortTaskList(
    filterTasksByQuery(filterTasks(tasks, filter), query, assigneeTerms),
    sort,
    "manager",
  );
  const reviewTasks = visibleTasks.filter((task) => task.status === "submitted");
  const mainTasks =
    filter === "all"
      ? visibleTasks.filter((task) => task.status !== "submitted")
      : visibleTasks;
  const showReviewBlock = filter === "all" && reviewTasks.length > 0;

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Welcome back, {displayName}</h2>
          <p className="mt-1 text-sm text-muted">Create assignments and keep reviews moving.</p>
        </div>
        <details className="group relative">
          <summary aria-label="Create new task" className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
            <span aria-hidden="true" className="mr-2 text-lg leading-none">+</span>
            New task
          </summary>
          <div className="mt-3 sm:absolute sm:right-0 sm:z-20 sm:w-[min(42rem,calc(100vw-2rem))]">
            {membersResult.error ? (
              <EmptyState title="Members could not be loaded" variant="error">
                Refresh the page to try again before creating an assignment.
              </EmptyState>
            ) : (
              <CreateTaskForm members={members} />
            )}
          </div>
        </details>
      </section>

      {tasksResult.error ? (
        <EmptyState title="Tasks could not be loaded" variant="error">
          Refresh the page to try again.
        </EmptyState>
      ) : (
        <>
          <TaskStatusSummary
            pathname="/manager"
            counts={counts}
            selected={filter}
            query={query}
            sort={sort}
          />
          <TaskListControls
            pathname="/manager"
            query={query}
            sort={sort}
            status={filter}
          />
          {showReviewBlock && (
            <section aria-labelledby="needs-review-heading">
              <h2
                id="needs-review-heading"
                className="mb-4 text-lg font-semibold text-foreground"
              >
                Needs your review
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {reviewTasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <p className="text-xs font-semibold text-status-submitted-fg">
                      Awaiting review
                    </p>
                    <TaskCard
                      task={task}
                      href={`/manager/tasks/${task.id}`}
                      now={now}
                      assigneeName={membersById.get(task.assignee_id)?.full_name || undefined}
                      assigneeEmail={membersById.get(task.assignee_id)?.email}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="manager-tasks-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="manager-tasks-heading" className="text-lg font-semibold text-foreground">
                  Your tasks
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Submitted work is prioritized for review.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="tabular text-xs text-muted">
                  {mainTasks.length} {mainTasks.length === 1 ? "task" : "tasks"}
                </p>
                {filter !== "all" && (
                  <Link
                    href={buildTaskListHref("/manager", { query, sort })}
                    className="rounded text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    Show all tasks
                  </Link>
                )}
              </div>
            </div>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks created yet">
                Create a task above to assign work to a member.
              </EmptyState>
            ) : visibleTasks.length === 0 ? (
              <EmptyState title="No tasks match your search">
                Try changing your search or clearing the status filter.{" "}
                <Link
                  href={buildTaskListHref("/manager", { sort })}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Clear search
                </Link>
              </EmptyState>
            ) : mainTasks.length === 0 ? (
              <EmptyState title="All tasks are awaiting review">
                Submitted tasks are listed in Needs your review above.
              </EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {mainTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    href={`/manager/tasks/${task.id}`}
                    now={now}
                    assigneeName={membersById.get(task.assignee_id)?.full_name || undefined}
                    assigneeEmail={membersById.get(task.assignee_id)?.email}
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

export default function ManagerPage(props: ManagerPageProps) {
  return (
    <AppShell title="Manager dashboard" role="manager">
      <Suspense fallback={<DashboardSkeleton />}>
        <ManagerDashboard searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}

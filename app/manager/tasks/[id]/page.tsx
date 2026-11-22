import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskDetailLayout } from "@/components/ui/task-detail-layout";
import { TaskDetailSkeleton } from "@/components/ui/skeletons";
import { SubmissionPanel } from "@/components/ui/submission-panel";
import { buildTaskHistory, getTaskDueInfo } from "@/lib/task-presentation";
import { canTransitionTaskStatus } from "@/lib/task-rules";
import { requireRole } from "@/lib/auth";
import { ReviewForm } from "./review-form";
import type { Review, Submission, Task } from "@/lib/types";

export const metadata: Metadata = {
  title: "Task review",
};

type ManagerTaskPageProps = {
  params: Promise<{ id: string }>;
};

async function ManagerTaskTitle({ params }: ManagerTaskPageProps) {
  await connection();
  const { id } = await params;
  const user = await requireRole("manager");
  const supabase = await createSupabaseServerClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, title, manager_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logDatabaseError(error, error.code);
    return "Task details";
  }
  if (!task || task.manager_id !== user.id) notFound();
  return task.title;
}

async function ManagerTaskContent({ params }: ManagerTaskPageProps) {
  await connection();
  const { id } = await params;
  const user = await requireRole("manager");
  const supabase = await createSupabaseServerClient();
  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (taskError) {
    logDatabaseError(taskError, taskError.code);
    return (
      <EmptyState title="Task could not be loaded" variant="error">
        Refresh the page to try again.
      </EmptyState>
    );
  }
  if (!taskData) notFound();

  const task = taskData as Task;
  if (task.manager_id !== user.id) notFound();
  const dueInfo = getTaskDueInfo(task.due_date, task.status, new Date().toISOString());

  const [submissionsResult, reviewsResult] = await Promise.all([
    supabase
      .from("submissions")
      .select("*")
      .eq("task_id", id)
      .order("version", { ascending: true }),
    supabase
      .from("reviews")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (submissionsResult.error) {
    logDatabaseError(submissionsResult.error, submissionsResult.error.code);
  }
  if (reviewsResult.error) logDatabaseError(reviewsResult.error, reviewsResult.error.code);

  const historyError = Boolean(submissionsResult.error || reviewsResult.error);
  const submissions = (submissionsResult.data ?? []) as Submission[];
  const reviews = (reviewsResult.data ?? []) as Review[];
  const latest = submissions.at(-1);
  const canReview =
    canTransitionTaskStatus(task.status, "approved")
    || canTransitionTaskStatus(task.status, "changes_requested");

  return (
    <TaskDetailLayout
      role="manager"
      history={historyError ? [] : buildTaskHistory(task, submissions, reviews, "manager")}
      historyError={historyError}
      actions={
        canReview && latest && !historyError ? (
          <div className="sticky bottom-3 z-20 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:p-4">
            <p className="mb-2 px-1 text-sm font-semibold text-foreground">Review this submission</p>
            <ReviewForm taskId={task.id} submissionId={latest.id} />
          </div>
        ) : null
      }
    >
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {task.instructions}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
          Due date: <span className="tabular font-semibold text-foreground">{task.due_date}</span>
          {dueInfo.overdue ? (
            <span className="ml-2 inline-flex rounded-full border border-status-changes-ring bg-status-changes-bg px-2 py-0.5 text-xs font-medium text-status-changes-fg">
              {dueInfo.relativeLabel}
            </span>
          ) : dueInfo.dueSoon ? (
            <span className="ml-2 inline-flex rounded-full border border-status-changes-ring bg-status-changes-bg px-2 py-0.5 text-xs font-medium text-status-changes-fg">
              Due soon
            </span>
          ) : null}
        </p>
      </section>
      {historyError ? (
        <EmptyState title="Submission could not be loaded" variant="error">
          Refresh the page to try again.
        </EmptyState>
      ) : latest ? (
        <SubmissionPanel submission={latest} />
      ) : (
        <EmptyState title="Waiting for a submission">
          The assigned member has not submitted work yet.
        </EmptyState>
      )}
    </TaskDetailLayout>
  );
}

export default function ManagerTaskPage({ params }: ManagerTaskPageProps) {
  return (
    <AppShell
      role="manager"
      title={
        <Suspense fallback={<span className="inline-block h-7 w-48 animate-pulse rounded bg-border" />}>
          <ManagerTaskTitle params={params} />
        </Suspense>
      }
    >
      <Suspense fallback={<TaskDetailSkeleton />}>
        <ManagerTaskContent params={params} />
      </Suspense>
    </AppShell>
  );
}

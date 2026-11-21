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
import { SubmissionForm } from "./submission-form";
import type { Review, Submission, Task } from "@/lib/types";

export const metadata: Metadata = {
  title: "Task details",
};

type MemberTaskPageProps = {
  params: Promise<{ id: string }>;
};

async function MemberTaskTitle({ params }: MemberTaskPageProps) {
  await connection();
  const { id } = await params;
  const user = await requireRole("member");
  const supabase = await createSupabaseServerClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, title, assignee_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logDatabaseError(error, error.code);
    return "Task details";
  }
  if (!task || task.assignee_id !== user.id) notFound();
  return task.title;
}

async function MemberTaskContent({ params }: MemberTaskPageProps) {
  await connection();
  const { id } = await params;
  const user = await requireRole("member");
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
  if (task.assignee_id !== user.id) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = getTaskDueInfo(task.due_date, task.status, today).overdue;

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
  const latestReview = reviews.at(-1);
  const feedback =
    task.status === "changes_requested"
    && latestReview?.decision === "changes_requested"
      ? latestReview.feedback
      : null;
  const canSubmit = canTransitionTaskStatus(task.status, "submitted");

  return (
    <TaskDetailLayout
      role="member"
      history={historyError ? [] : buildTaskHistory(task, submissions, reviews, "member")}
      historyError={historyError}
    >
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
          <StatusBadge status={task.status} />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
          {task.instructions}
        </p>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
          Due date: <span className="tabular font-semibold text-foreground">{task.due_date}</span>
          {overdue && <span className="ml-2 font-medium text-danger">Overdue</span>}
        </p>
      </section>
      {historyError ? (
        <EmptyState title="Submission could not be loaded" variant="error">
          Refresh the page to try again.
        </EmptyState>
      ) : canSubmit ? (
        <SubmissionForm taskId={task.id} feedback={feedback} />
      ) : latest ? (
        <SubmissionPanel submission={latest} />
      ) : (
        <EmptyState title="No submission yet">
          Your written response and any optional attachments will appear here.
        </EmptyState>
      )}
      {task.status === "submitted" && (
        <p className="rounded-xl border border-status-submitted-ring bg-status-submitted-bg p-4 text-sm font-medium text-status-submitted-fg">
          Your work is awaiting the manager&apos;s review.
        </p>
      )}
      {task.status === "approved" && (
        <p className="rounded-xl border border-status-approved-ring bg-status-approved-bg p-4 text-sm font-medium text-status-approved-fg">
          This task is approved and can no longer be changed.
        </p>
      )}
    </TaskDetailLayout>
  );
}

export default function MemberTaskPage({ params }: MemberTaskPageProps) {
  return (
    <AppShell
      role="member"
      title={
        <Suspense fallback={<span className="inline-block h-7 w-48 animate-pulse rounded bg-border" />}>
          <MemberTaskTitle params={params} />
        </Suspense>
      }
    >
      <Suspense fallback={<TaskDetailSkeleton />}>
        <MemberTaskContent params={params} />
      </Suspense>
    </AppShell>
  );
}

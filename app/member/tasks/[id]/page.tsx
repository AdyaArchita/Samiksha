import { Suspense } from "react";
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
import { buildTaskHistory } from "@/lib/task-presentation";
import { canTransitionTaskStatus } from "@/lib/task-rules";
import { requireRole } from "@/lib/auth";
import { SubmissionForm } from "./submission-form";
import type { Review, Submission, Task } from "@/lib/types";

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
    .single();

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
    .single();

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
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Instructions</h2>
          <StatusBadge status={task.status} />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {task.instructions}
        </p>
        <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          Due date: <span className="font-semibold text-slate-800">{task.due_date}</span>
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
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Your work is awaiting the manager&apos;s review.
        </p>
      )}
      {task.status === "approved" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
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
        <Suspense fallback={<span className="inline-block h-7 w-48 animate-pulse rounded bg-slate-200" />}>
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

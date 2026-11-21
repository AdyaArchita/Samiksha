import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { ReviewForm } from "./review-form";
import type { Review, Submission, Task } from "@/lib/types";

export default async function ManagerTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: taskData } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (!taskData) notFound();
  const task = taskData as Task;
  if (task.manager_id !== auth.user.id) notFound();

  const { data: submissionsData } = await supabase
    .from("submissions")
    .select("*")
    .eq("task_id", id)
    .order("version", { ascending: true });
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  const submissions = (submissionsData ?? []) as Submission[];
  const reviews = (reviewsData ?? []) as Review[];
  const latest = submissions.at(-1);

  return (
    <AppShell title={task.title}>
      <a href="/manager" className="text-sm text-blue-700">← Back to tasks</a>
      <section className="mt-4 rounded-lg border bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Instructions</h2>
            <p className="mt-2 whitespace-pre-wrap text-zinc-700">{task.instructions}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Due: {task.due_date ? task.due_date : "No due date"}
        </p>
      </section>

      {task.status === "submitted" && latest && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Review latest submission</h2>
          <ReviewForm taskId={task.id} submissionId={latest.id} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Submission history</h2>
        {submissions.length === 0 ? (
          <p className="rounded-lg border bg-white p-5 text-sm text-zinc-600">No submissions yet.</p>
        ) : (
          <div className="grid gap-3">
            {submissions.map((submission) => {
              const review = reviews.find((item) => item.submission_id === submission.id);
              return (
                <article key={submission.id} className="rounded-lg border bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Version {submission.version}</h3>
                    <span className="text-xs text-zinc-500">{new Date(submission.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-zinc-700">{submission.body}</p>
                  {submission.link && (
                    <a href={submission.link} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-blue-700 break-all">
                      {submission.link}
                    </a>
                  )}
                  {submission.file_path && (
                    <a
                      href={`/api/files/signed?path=${encodeURIComponent(submission.file_path)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-sm text-blue-700"
                    >
                      Download attachment
                    </a>
                  )}
                  {review && (
                    <div className="mt-4 rounded-md bg-zinc-50 p-3">
                      <p className="text-sm font-medium">
                        {review.decision === "approved" ? "Approved" : "Changes Requested"}
                      </p>
                      {review.feedback && <p className="mt-1 text-sm text-zinc-700">{review.feedback}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

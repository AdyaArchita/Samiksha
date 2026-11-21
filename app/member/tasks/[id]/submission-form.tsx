"use client";

import { useActionState } from "react";
import { submitWork } from "@/app/actions/submissions";
import type { ActionState } from "@/app/actions/tasks";

export function SubmissionForm({
  taskId,
  feedback,
}: {
  taskId: string;
  feedback: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    submitWork,
    undefined,
  );

  return (
    <section className="mt-6 rounded-lg border bg-white p-5">
      {feedback && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">Manager feedback</p>
          <p className="mt-1 text-sm text-amber-800">{feedback}</p>
        </div>
      )}
      {state?.error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p role="status" className="mb-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p>}
      <form action={action} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <label className="block text-sm font-medium">
          Written response
          <textarea name="body" required rows={6} maxLength={10000} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          Link (optional)
          <input name="link" type="url" placeholder="https://" className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          File (optional, up to 5 MB)
          <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip" className="mt-1 block w-full text-sm" />
        </label>
        <button disabled={pending} className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50">
          {pending ? "Submitting..." : "Submit work"}
        </button>
      </form>
    </section>
  );
}

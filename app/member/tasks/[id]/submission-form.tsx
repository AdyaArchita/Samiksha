"use client";

import { useActionState } from "react";
import { submitWork } from "@/app/actions/submissions";
import type { ActionState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function SubmissionForm({
  taskId,
  feedback,
}: {
  taskId: string;
  feedback: string | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    submitWork,
    undefined,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {feedback && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-900">Changes requested</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800">{feedback}</p>
        </div>
      )}
      {state?.error && <div className="mb-4"><Toast variant="error">{state.error}</Toast></div>}
      {state?.success && <div className="mb-4"><Toast variant="success">{state.success}</Toast></div>}
      <h2 className="text-lg font-semibold text-slate-900">
        {feedback ? "Submit a revised version" : "Submit your work"}
      </h2>
      <form action={action} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <p className="text-sm text-slate-600">
          Your written response is required. A file and link are optional; you may include either, both, or neither.
        </p>
        <label className="block text-sm font-semibold text-slate-700">
          Written response
          <textarea name="body" required rows={6} maxLength={10000} className={fieldClassName} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Link (optional)
          <input name="link" type="url" placeholder="https://" className={fieldClassName} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          File (optional, up to 5 MB)
          <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip" className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold file:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
        </label>
        <Button pendingLabel="Submitting work...">Submit work</Button>
      </form>
    </section>
  );
}

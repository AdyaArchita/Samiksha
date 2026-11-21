"use client";

import { useActionState } from "react";
import { submitWork } from "@/app/actions/submissions";
import type { ActionState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

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
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      {feedback && (
        <div className="mb-5 rounded-lg border border-status-changes-ring bg-status-changes-bg p-4">
          <StatusBadge status="changes_requested" />
          <p className="mt-2 whitespace-pre-wrap text-sm text-status-changes-fg">{feedback}</p>
        </div>
      )}
      {state?.error && <div className="mb-4"><Toast variant="error">{state.error}</Toast></div>}
      {state?.success && <div className="mb-4"><Toast variant="success">{state.success}</Toast></div>}
      <h2 className="text-lg font-semibold text-foreground">
        {feedback ? "Submit a revised version" : "Submit your work"}
      </h2>
      <form action={action} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <p className="text-sm text-muted">
          Your written response is required. A file and link are optional; you may include either, both, or neither.
        </p>
        <label className="block text-sm font-semibold text-foreground">
          Written response
          <textarea name="body" required rows={6} maxLength={10000} className={fieldClassName} />
        </label>
        <label className="block text-sm font-semibold text-foreground">
          Link (optional)
          <input name="link" type="url" placeholder="https://" className={fieldClassName} />
        </label>
        <label className="block text-sm font-semibold text-foreground">
          File (optional, up to 5 MB)
          <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip" className="mt-1.5 block w-full rounded-lg border border-border bg-surface p-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-background file:px-3 file:py-1.5 file:font-semibold file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" />
        </label>
        <Button pendingLabel="Submitting work...">Submit work</Button>
      </form>
    </section>
  );
}

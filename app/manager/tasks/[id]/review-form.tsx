"use client";

import { useActionState } from "react";
import { reviewSubmission } from "@/app/actions/reviews";
import type { ActionState } from "@/app/actions/tasks";

export function ReviewForm({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    reviewSubmission,
    undefined,
  );

  return (
    <form action={action} className="mt-4 space-y-3 rounded-lg border bg-white p-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="submissionId" value={submissionId} />
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p>}
      <label className="block text-sm font-medium">
        Feedback (required to request changes)
        <textarea name="feedback" rows={3} maxLength={5000} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button name="decision" value="approved" disabled={pending} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const feedback = (form.elements.namedItem("feedback") as HTMLTextAreaElement).value.trim();
            if (!feedback) {
              window.alert("Written feedback is required when requesting changes.");
              return;
            }
            const decision = (form.elements.namedItem("decision") as HTMLInputElement | null);
            if (decision) {
              decision.value = "changes_requested";
              form.requestSubmit();
            } else {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = "decision";
              input.value = "changes_requested";
              form.append(input);
              form.requestSubmit();
            }
          }}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Request Changes
        </button>
      </div>
    </form>
  );
}

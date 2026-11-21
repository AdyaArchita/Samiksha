"use client";

import { useActionState } from "react";
import { useState } from "react";
import { reviewSubmission } from "@/app/actions/reviews";
import type { ActionState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function ReviewForm({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    reviewSubmission,
    undefined,
  );
  const [requestingChanges, setRequestingChanges] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="submissionId" value={submissionId} />
      {state?.error && <Toast variant="error">{state.error}</Toast>}
      {state?.success && <Toast variant="success">{state.success}</Toast>}
      <div className="flex flex-wrap gap-2">
        <Button
          name="decision"
          value="approved"
          variant="primary"
          pendingLabel="Approving..."
          onClick={(event) => {
            if (!window.confirm("Approve this submission?")) event.preventDefault();
          }}
        >
          Approve
        </Button>
        {!requestingChanges && (
          <Button
            type="button"
            variant="changes"
            onClick={() => setRequestingChanges(true)}
          >
            Request changes
          </Button>
        )}
      </div>
      {requestingChanges && (
        <div className="space-y-3 rounded-lg border border-status-changes-ring bg-status-changes-bg p-4">
          <label className="block text-sm font-semibold text-status-changes-fg">
            Feedback for the member (required)
            <textarea
              name="feedback"
              required
              rows={3}
              maxLength={5000}
              className="mt-1.5 min-h-24 w-full rounded-lg border border-status-changes-ring bg-surface px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-changes-fg"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              name="decision"
              value="changes_requested"
              variant="changes"
              pendingLabel="Sending feedback..."
              onClick={(event) => {
                if (!window.confirm("Send this feedback and request changes?")) {
                  event.preventDefault();
                }
              }}
            >
              Send request
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRequestingChanges(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

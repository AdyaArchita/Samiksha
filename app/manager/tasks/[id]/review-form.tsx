"use client";

import { useActionState } from "react";
import { useEffect, useRef, useState } from "react";
import { reviewSubmission } from "@/app/actions/reviews";
import type { ActionState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type ReviewDialogMode = "approve" | "changes" | null;

export function ReviewForm({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const [dialogMode, setDialogMode] = useState<ReviewDialogMode>(null);
  const [feedback, setFeedback] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(
    async (previousState, formData) => {
      const result = await reviewSubmission(previousState, formData);
      if (result?.success) {
        setDialogMode(null);
        setFeedback("");
      }
      return result;
    },
    undefined,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dialogMode) {
      if (!dialog.open) dialog.showModal();
      dialog
        .querySelector<HTMLElement>("[data-dialog-initial-focus]")
        ?.focus();
    } else if (dialog.open) {
      dialog.close();
      triggerRef.current?.focus();
    }
  }, [dialogMode]);

  function openDialog(mode: Exclude<ReviewDialogMode, null>, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setDialogMode(mode);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="submissionId" value={submissionId} />
      {!dialogMode && state?.error && <Toast variant="error">{state.error}</Toast>}
      {!dialogMode && state?.success && <Toast variant="success">{state.success}</Toast>}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          type="button"
          onClick={(event) => openDialog("approve", event.currentTarget)}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="changes"
          onClick={(event) => openDialog("changes", event.currentTarget)}
        >
          Request changes
        </Button>
      </div>
      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          setDialogMode(null);
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-foreground/30"
      >
        {dialogMode && (
          <>
            <div className="space-y-4 p-5">
              <h2 id="review-dialog-title" className="text-lg font-semibold">
                {dialogMode === "approve" ? "Approve submission" : "Request changes"}
              </h2>
              {dialogMode === "approve" ? (
                <p className="text-sm text-muted">Approve this submission?</p>
              ) : (
                <label className="block text-sm font-semibold text-foreground">
                  Feedback for the member (required)
                  <textarea
                    ref={(element) => {
                      if (element) element.dataset.dialogInitialFocus = "true";
                    }}
                    name="feedback"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    required
                    rows={4}
                    maxLength={5000}
                    className="mt-1.5 min-h-24 w-full rounded-lg border border-status-changes-ring bg-surface px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-changes-fg"
                  />
                </label>
              )}
              {dialogMode && state?.error && (
                <Toast variant="error">{state.error}</Toast>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border p-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              {dialogMode === "approve" ? (
                <Button
                  type="submit"
                  name="decision"
                  value="approved"
                  variant="primary"
                  pendingLabel="Approving..."
                  data-dialog-initial-focus
                >
                  Confirm
                </Button>
              ) : (
                <Button
                  type="submit"
                  name="decision"
                  value="changes_requested"
                  variant="changes"
                  pendingLabel="Requesting changes..."
                  disabled={!feedback.trim()}
                  data-dialog-initial-focus
                >
                  Confirm
                </Button>
              )}
            </div>
          </>
        )}
      </dialog>
    </form>
  );
}

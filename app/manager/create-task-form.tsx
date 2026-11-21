"use client";

import { useActionState } from "react";
import { createTask, type ActionState } from "@/app/actions/tasks";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function CreateTaskForm({ members }: { members: Profile[] }) {
  const [state, action] = useActionState<ActionState, FormData>(
    createTask,
    undefined,
  );

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-lg sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Create task</h2>
      {state?.error && <div className="mt-4"><Toast variant="error">{state.error}</Toast></div>}
      {state?.success && <div className="mt-4"><Toast variant="success">{state.success}</Toast></div>}
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-foreground sm:col-span-2">
          Title
          <input name="title" required maxLength={120} className={fieldClassName} />
        </label>
        <label className="text-sm font-semibold text-foreground sm:col-span-2">
          Instructions
          <textarea name="instructions" required rows={4} maxLength={5000} className={fieldClassName} />
        </label>
        <label className="text-sm font-semibold text-foreground">
          Assignee
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No member profiles are available.</p>
          ) : (
            <select name="assigneeId" required className={fieldClassName} defaultValue="">
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="text-sm font-semibold text-foreground">
          Due date (required)
          <input name="dueDate" type="date" required className={fieldClassName} />
        </label>
        <Button
          disabled={members.length === 0}
          pendingLabel="Creating task..."
          className="sm:col-span-2"
        >
          Create task
        </Button>
      </form>
    </section>
  );
}

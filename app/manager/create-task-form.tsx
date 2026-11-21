"use client";

import { useActionState } from "react";
import { createTask, type ActionState } from "@/app/actions/tasks";
import type { Profile } from "@/lib/types";

export function CreateTaskForm({ members }: { members: Profile[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createTask,
    undefined,
  );

  return (
    <section className="rounded-lg border bg-white p-5">
      <h2 className="text-lg font-semibold">Create task</h2>
      {state?.error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p role="status" className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p>}
      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">
          Title
          <input name="title" required maxLength={120} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Instructions
          <textarea name="instructions" required rows={4} maxLength={5000} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Assignee
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No member profiles are available.</p>
          ) : (
            <select name="assigneeId" required className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="text-sm font-medium">
          Due date
          <input name="dueDate" type="date" className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button disabled={pending || members.length === 0} className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white disabled:opacity-50 sm:col-span-2">
          {pending ? "Creating..." : "Create task"}
        </button>
      </form>
    </section>
  );
}

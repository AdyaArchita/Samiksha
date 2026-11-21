"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors";
import {
  taskCreationFailure,
  taskCreationValidationMessage,
} from "@/lib/task-errors";
import { createTaskSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: string } | undefined;

export async function createTask(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    dueDate: formData.get("dueDate"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      error: taskCreationValidationMessage(
        typeof field === "string" || typeof field === "number" ? field : undefined,
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in again to create this task." };

  const { error } = await supabase.from("tasks").insert({
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    due_date: parsed.data.dueDate,
    manager_id: auth.user.id,
    assignee_id: parsed.data.assigneeId,
  });

  if (error) {
    const failure = taskCreationFailure(error);
    if (failure.shouldLog) logDatabaseError(error, error.code);
    return { error: failure.message };
  }

  revalidatePath("/manager");
  return { success: "Task created." };
}

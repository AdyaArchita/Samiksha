"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { friendlyPostgresError, logDatabaseError } from "@/lib/errors";
import { createTaskSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: string } | undefined;

export async function createTask(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    dueDate: formData.get("dueDate") || undefined,
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    return { error: "Check the task title, instructions, assignee, and due date." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in again to create this task." };

  const { error } = await supabase.from("tasks").insert({
    title: parsed.data.title,
    instructions: parsed.data.instructions,
    due_date: parsed.data.dueDate ?? null,
    status: "assigned",
    manager_id: auth.user.id,
    assignee_id: parsed.data.assigneeId,
  });

  if (error) {
    logDatabaseError(error, error.code);
    return { error: friendlyPostgresError(error) };
  }

  revalidatePath("/manager");
  return { success: "Task created." };
}

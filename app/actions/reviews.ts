"use server";

import { revalidatePath } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { friendlyPostgresError, logDatabaseError } from "@/lib/errors";
import { reviewSchema } from "@/lib/validation";
import type { ActionState } from "@/app/actions/tasks";

export async function reviewSubmission(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    taskId: formData.get("taskId"),
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    feedback: formData.get("feedback") || undefined,
  });
  if (!parsed.success) {
    return { error: "Select a valid decision and add feedback when requesting changes." };
  }
  if (
    parsed.data.decision === "changes_requested"
    && (!parsed.data.feedback || parsed.data.feedback.trim() === "")
  ) {
    return { error: "Written feedback is required when requesting changes." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in again to review this submission." };

  const { error } = await supabase.from("reviews").insert({
    task_id: parsed.data.taskId,
    submission_id: parsed.data.submissionId,
    reviewer_id: auth.user.id,
    decision: parsed.data.decision,
    feedback:
      parsed.data.decision === "approved"
        ? parsed.data.feedback?.trim() || null
        : parsed.data.feedback?.trim() ?? null,
  });
  if (error) {
    logDatabaseError(error, error.code);
    return { error: friendlyPostgresError(error) };
  }

  revalidatePath(`/manager/tasks/${parsed.data.taskId}`);
  revalidatePath(`/member/tasks/${parsed.data.taskId}`);
  revalidatePath("/manager");
  revalidatePath("/member");
  return {
    success:
      parsed.data.decision === "approved"
        ? "Submission approved."
        : "Changes requested.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { friendlyPostgresError, logDatabaseError } from "@/lib/errors";
import { buildSubmissionStoragePath } from "@/lib/task-rules";
import { submissionFileSchema, submissionSchema } from "@/lib/validation";
import type { ActionState } from "@/app/actions/tasks";

export async function submitWork(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const taskId = formData.get("taskId");
  const file = formData.get("file");
  const parsed = submissionSchema.safeParse({
    taskId,
    body: formData.get("body"),
    link: formData.get("link") || undefined,
    hasFile: file instanceof File && file.size > 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Add a response and a file or link." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in again to submit work." };

  const submissionId = crypto.randomUUID();
  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const fileValidation = submissionFileSchema.safeParse({
      size: file.size,
      type: file.type,
    });
    if (!fileValidation.success) {
      return {
        error: fileValidation.error.issues[0]?.message ?? "The file is not allowed.",
      };
    }

    filePath = buildSubmissionStoragePath(
      parsed.data.taskId,
      submissionId,
      file.name,
    );
    const { error: uploadError } = await supabase.storage
      .from("submission-files")
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      logDatabaseError(uploadError, uploadError.statusCode);
      return { error: friendlyPostgresError(uploadError) };
    }
  }

  const { error } = await supabase.from("submissions").insert({
    id: submissionId,
    task_id: parsed.data.taskId,
    author_id: auth.user.id,
    body: parsed.data.body,
    link: parsed.data.link ?? null,
    file_path: filePath,
  });

  if (error) {
    logDatabaseError(error, error.code);
    return { error: friendlyPostgresError(error) };
  }

  revalidatePath(`/member/tasks/${parsed.data.taskId}`);
  revalidatePath(`/manager/tasks/${parsed.data.taskId}`);
  return { success: "Submission sent for review." };
}

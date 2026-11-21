"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { friendlyPostgresError, logDatabaseError } from "@/lib/errors";
import { submissionSchema } from "@/lib/validation";
import type { ActionState } from "@/app/actions/tasks";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
]);

export async function submitWork(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const taskId = formData.get("taskId");
  const parsed = submissionSchema.safeParse({
    taskId,
    body: formData.get("body"),
    link: formData.get("link") || undefined,
  });
  if (!parsed.success) {
    return { error: "A response and a valid http(s) link are required when provided." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sign in again to submit work." };

  const file = formData.get("file");
  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Files must be 5 MB or smaller." };
    }
    if (!allowedTypes.has(file.type)) {
      return { error: "This file type is not allowed." };
    }

    const submissionId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    filePath = `${parsed.data.taskId}/${submissionId}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("submission-files")
      .upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      logDatabaseError(uploadError, uploadError.statusCode);
      return { error: friendlyPostgresError(uploadError) };
    }
  }

  const { error } = await supabase.from("submissions").insert({
    task_id: parsed.data.taskId,
    author_id: auth.user.id,
    version: 1,
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

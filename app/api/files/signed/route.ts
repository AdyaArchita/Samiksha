import { NextRequest, NextResponse } from "next/server";
import {
  canAccessSubmissionFile,
  parseSubmissionStoragePath,
} from "@/lib/task-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "File path is required." }, { status: 400 });
  const pathParts = parseSubmissionStoragePath(path);
  if (!pathParts) return NextResponse.json({ error: "Invalid file path." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) logDatabaseError(authError, authError.code);
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, manager_id, assignee_id")
    .eq("id", pathParts.taskId)
    .maybeSingle();
  if (taskError) {
    logDatabaseError(taskError, taskError.code);
    return NextResponse.json({ error: "The file could not be opened." }, { status: 500 });
  }
  if (
    !task
    || (task.manager_id !== auth.user.id && task.assignee_id !== auth.user.id)
  ) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, task_id, file_path")
    .eq("id", pathParts.submissionId)
    .eq("task_id", pathParts.taskId)
    .eq("file_path", path)
    .maybeSingle();
  if (submissionError) {
    logDatabaseError(submissionError, submissionError.code);
    return NextResponse.json({ error: "The file could not be opened." }, { status: 500 });
  }
  if (!submission || !canAccessSubmissionFile(auth.user.id, path, task, submission)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("submission-files")
    .createSignedUrl(path, 300);
  if (error) {
    logDatabaseError(error);
    return NextResponse.json({ error: "The file could not be opened." }, { status: 403 });
  }
  if (!data) return NextResponse.json({ error: "The file could not be opened." }, { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}

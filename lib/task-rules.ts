import type { TaskStatus } from "@/lib/types";

export const taskTransitions: Record<TaskStatus, readonly TaskStatus[]> = {
  assigned: ["submitted"],
  submitted: ["approved", "changes_requested"],
  changes_requested: ["submitted"],
  approved: [],
};

export const maxSubmissionFileBytes = 5 * 1024 * 1024;

export const submissionMimeTypes = [
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
] as const;

export function canTransitionTaskStatus(
  from: TaskStatus,
  to: TaskStatus,
): boolean {
  return taskTransitions[from].includes(to);
}

export function isValidHttpLink(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

export function isAllowedSubmissionMimeType(mimeType: string): boolean {
  return submissionMimeTypes.some((allowedType) => allowedType === mimeType);
}

export function isValidSubmissionFile(size: number, mimeType: string): boolean {
  return (
    Number.isInteger(size) &&
    size > 0 &&
    size <= maxSubmissionFileBytes &&
    isAllowedSubmissionMimeType(mimeType)
  );
}

export function parseSubmissionStoragePath(
  path: string,
): { taskId: string; submissionId: string } | null {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const match = new RegExp(`^(${uuid})/(${uuid})/([a-z0-9._-]+)$`, "i").exec(path);
  if (!match || match[3] === "." || match[3] === "..") return null;

  return { taskId: match[1], submissionId: match[2] };
}

export function canAccessSubmissionFile(
  userId: string,
  path: string,
  task: { id: string; manager_id: string; assignee_id: string },
  submission: { id: string; task_id: string; file_path: string | null },
): boolean {
  const pathParts = parseSubmissionStoragePath(path);
  return Boolean(
    pathParts
    && task.id === pathParts.taskId
    && submission.id === pathParts.submissionId
    && submission.task_id === task.id
    && submission.file_path === path
    && (task.manager_id === userId || task.assignee_id === userId),
  );
}

export function buildSubmissionStoragePath(
  taskId: string,
  submissionId: string,
  filename: string,
): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${taskId}/${submissionId}/${safeFilename}`;
}

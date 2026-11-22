import { describe, expect, it } from "vitest";
import {
  canAccessSubmissionFile,
  buildSubmissionStoragePath,
  canTransitionTaskStatus,
  isValidHttpLink,
  isValidSubmissionFile,
  maxSubmissionFileBytes,
  parseSubmissionStoragePath,
} from "../../lib/task-rules";

describe("task state transitions", () => {
  it.each([
    ["assigned", "assigned", false],
    ["assigned", "submitted", true],
    ["assigned", "changes_requested", false],
    ["assigned", "approved", false],
    ["submitted", "assigned", false],
    ["submitted", "submitted", false],
    ["changes_requested", "submitted", true],
    ["submitted", "approved", true],
    ["submitted", "changes_requested", true],
    ["changes_requested", "assigned", false],
    ["changes_requested", "changes_requested", false],
    ["changes_requested", "approved", false],
    ["approved", "assigned", false],
    ["approved", "submitted", false],
    ["approved", "changes_requested", false],
    ["approved", "approved", false],
  ] as const)(
    "%s -> %s is %s",
    (from, to, allowed) => {
      expect(canTransitionTaskStatus(from, to)).toBe(allowed);
    },
  );
});

describe("submission validation", () => {
  it("accepts only valid HTTP and HTTPS URLs", () => {
    expect(isValidHttpLink("https://example.test/work")).toBe(true);
    expect(isValidHttpLink("http://example.test")).toBe(true);
    expect(isValidHttpLink("javascript:alert(1)")).toBe(false);
    expect(isValidHttpLink("http://")).toBe(false);
  });

  it("enforces file size and MIME type limits", () => {
    expect(isValidSubmissionFile(1024, "application/pdf")).toBe(true);
    expect(isValidSubmissionFile(maxSubmissionFileBytes, "image/png")).toBe(true);
    expect(isValidSubmissionFile(maxSubmissionFileBytes + 1, "image/png")).toBe(false);
    expect(isValidSubmissionFile(1024, "application/x-msdownload")).toBe(false);
    expect(isValidSubmissionFile(0, "text/plain")).toBe(false);
  });

  it("builds the task/submission/file storage path and sanitizes filename", () => {
    expect(
      buildSubmissionStoragePath(
        "task-id",
        "submission-id",
        "report one.pdf",
      ),
    ).toBe("task-id/submission-id/report_one.pdf");
  });

  it("accepts only a single safe filename under UUID task and submission folders", () => {
    const taskId = "18c85ff8-0465-4e84-9c46-fb60f98f4a17";
    const submissionId = "f2f2343b-146c-4c7f-8da8-60e8d9da856e";
    expect(parseSubmissionStoragePath(`${taskId}/${submissionId}/report.pdf`)).toEqual({
      taskId,
      submissionId,
    });
    expect(parseSubmissionStoragePath(`${taskId}/${submissionId}/../report.pdf`)).toBeNull();
    expect(parseSubmissionStoragePath(`${taskId}/${submissionId}/..`)).toBeNull();
    expect(parseSubmissionStoragePath(`${taskId}/${submissionId}/folder\\report.pdf`)).toBeNull();
    expect(parseSubmissionStoragePath(`${taskId}/${submissionId}/report.pdf/extra`)).toBeNull();
  });

  it("requires a task party and the exact recorded submission file path", () => {
    const task = {
      id: "18c85ff8-0465-4e84-9c46-fb60f98f4a17",
      manager_id: "manager-id",
      assignee_id: "member-id",
    };
    const submission = {
      id: "f2f2343b-146c-4c7f-8da8-60e8d9da856e",
      task_id: task.id,
      file_path: `${task.id}/f2f2343b-146c-4c7f-8da8-60e8d9da856e/report.pdf`,
    };

    expect(canAccessSubmissionFile("manager-id", submission.file_path, task, submission)).toBe(true);
    expect(canAccessSubmissionFile("member-id", submission.file_path, task, submission)).toBe(true);
    expect(canAccessSubmissionFile("other-member", submission.file_path, task, submission)).toBe(false);
    expect(
      canAccessSubmissionFile(
        "member-id",
        `${task.id}/f2f2343b-146c-4c7f-8da8-60e8d9da856e/other.pdf`,
        task,
        submission,
      ),
    ).toBe(false);
  });
});

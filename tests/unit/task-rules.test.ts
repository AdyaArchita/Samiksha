import { describe, expect, it } from "vitest";
import {
  buildSubmissionStoragePath,
  canTransitionTaskStatus,
  isValidHttpLink,
  isValidSubmissionFile,
  maxSubmissionFileBytes,
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
});

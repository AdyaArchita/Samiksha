import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  reviewSchema,
  signupSchema,
  submissionFileSchema,
  submissionSchema,
} from "../../lib/validation";
import { maxSubmissionFileBytes } from "../../lib/task-rules";

const taskId = "18c85ff8-0465-4e84-9c46-fb60f98f4a17";

describe("Zod input schemas", () => {
  it("requires a real due date and valid assignee when creating a task", () => {
    const valid = {
      title: "Complete report",
      instructions: "Write the report.",
      dueDate: "2026-12-01",
      assigneeId: taskId,
    };
    expect(createTaskSchema.safeParse(valid).success).toBe(true);
    expect(createTaskSchema.safeParse({ ...valid, dueDate: "2026-02-31" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...valid, dueDate: undefined }).success).toBe(false);
  });

  it("accepts only safe links and non-empty response bodies", () => {
    const submission = {
      taskId,
      body: "My response",
      link: "https://example.test/document",
    };
    expect(submissionSchema.safeParse(submission).success).toBe(true);
    const withoutArtifact = submissionSchema.safeParse({
      taskId,
      body: "My response",
    });
    expect(withoutArtifact.success).toBe(false);
    if (!withoutArtifact.success) {
      expect(withoutArtifact.error.issues[0]?.message).toBe(
        "Add at least one file or link.",
      );
    }
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "My response",
        hasFile: true,
      }).success,
    ).toBe(true);
    expect(submissionSchema.safeParse({ ...submission, link: "javascript:alert(1)" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...submission, link: "http://" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...submission, body: "  " }).success).toBe(false);
  });

  it("requires feedback for a changes-requested review", () => {
    const review = {
      taskId,
      submissionId: taskId,
      decision: "changes_requested" as const,
    };
    expect(reviewSchema.safeParse({ ...review, feedback: "Add a source." }).success).toBe(true);
    expect(reviewSchema.safeParse(review).success).toBe(false);
    expect(
      reviewSchema.safeParse({
        ...review,
        decision: "approved",
      }).success,
    ).toBe(true);
  });

  it("validates the storage file limit and allowed MIME type", () => {
    expect(
      submissionFileSchema.safeParse({
        size: maxSubmissionFileBytes,
        type: "application/pdf",
      }).success,
    ).toBe(true);
    expect(
      submissionFileSchema.safeParse({
        size: maxSubmissionFileBytes + 1,
        type: "application/pdf",
      }).success,
    ).toBe(false);
    expect(
      submissionFileSchema.safeParse({
        size: 10,
        type: "application/x-msdownload",
      }).success,
    ).toBe(false);
  });

  it("validates signup identity fields without accepting role input", () => {
    const fields = {
      fullName: "Demo Member",
      email: "member@example.test",
      password: "valid-password",
    };
    expect(signupSchema.safeParse(fields).success).toBe(true);
    const withRole = signupSchema.safeParse({ ...fields, role: "manager" });
    expect(withRole.success).toBe(true);
    if (withRole.success) {
      expect(withRole.data).not.toHaveProperty("role");
    }
  });
});

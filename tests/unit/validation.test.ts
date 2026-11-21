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
const validFile = { size: 1024, type: "application/pdf" };

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

  it("accepts a text-only submission", () => {
    expect(submissionSchema.safeParse({ taskId, body: "My response" }).success).toBe(true);
  });

  it("accepts a written response with a link", () => {
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "My response",
        link: "https://example.test/document",
      }).success,
    ).toBe(true);
  });

  it("accepts a written response with a file", () => {
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "My response",
        hasFile: true,
      }).success,
    ).toBe(true);
    expect(submissionFileSchema.safeParse(validFile).success).toBe(true);
  });

  it("accepts a written response with both a file and a link", () => {
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "My response",
        link: "https://example.test/document",
        hasFile: true,
      }).success,
    ).toBe(true);
    expect(submissionFileSchema.safeParse(validFile).success).toBe(true);
  });

  it("rejects invalid links", () => {
    const submission = { taskId, body: "My response" };
    expect(
      submissionSchema.safeParse({ ...submission, link: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({ ...submission, link: "http://" }).success,
    ).toBe(false);
  });

  it("rejects an empty written response even when a file or link is present", () => {
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "  ",
        link: "https://example.test/document",
      }).success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({
        taskId,
        body: "  ",
        hasFile: true,
      }).success,
    ).toBe(false);
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

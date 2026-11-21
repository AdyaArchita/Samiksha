import { z } from "zod";
import {
  isValidHttpLink,
  isAllowedSubmissionMimeType,
  maxSubmissionFileBytes,
} from "./task-rules";

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email().trim(),
  password: z.string().min(8).max(72),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  instructions: z.string().trim().min(1).max(5000),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid due date.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Enter a valid due date."),
  assigneeId: z.uuid(),
});

export const submissionSchema = z.object({
  taskId: z.uuid(),
  body: z.string().trim().min(1).max(10000),
  link: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || isValidHttpLink(value),
      "Use a valid http:// or https:// link.",
    ),
  hasFile: z.boolean().optional(),
});

export const submissionFileSchema = z.object({
  size: z
    .number()
    .int()
    .positive("Choose a non-empty file.")
    .max(maxSubmissionFileBytes, "Files must be 5 MB or smaller."),
  type: z.string().refine(
      isAllowedSubmissionMimeType,
    "This file type is not allowed.",
  ),
});

export const reviewSchema = z.object({
  taskId: z.uuid(),
  submissionId: z.uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(5000).optional(),
}).superRefine((value, context) => {
  if (value.decision === "changes_requested" && !value.feedback) {
    context.addIssue({
      code: "custom",
      path: ["feedback"],
      message: "Written feedback is required when requesting changes.",
    });
  }
});

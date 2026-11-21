import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email().trim(),
  password: z.string().min(8).max(72),
  role: z.enum(["manager", "member"]),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  instructions: z.string().trim().min(1).max(5000),
  dueDate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Enter a valid due date.",
    }),
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
      (value) => !value || /^https?:\/\//i.test(value),
      "Use an http:// or https:// link.",
    ),
});

export const reviewSchema = z.object({
  taskId: z.uuid(),
  submissionId: z.uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(5000).optional(),
});

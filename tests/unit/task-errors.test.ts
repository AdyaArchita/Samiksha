import { describe, expect, it } from "vitest";
import {
  taskCreationFailure,
  taskCreationValidationMessage,
} from "../../lib/task-errors";

describe("task creation errors", () => {
  it("provides field-specific validation messages", () => {
    expect(taskCreationValidationMessage("title")).toBe("Enter a task title.");
    expect(taskCreationValidationMessage("dueDate")).toBe("Choose a valid due date.");
    expect(taskCreationValidationMessage(undefined)).toBe(
      "Check the task details and try again.",
    );
  });

  it("surfaces expected permission and business-rule errors", () => {
    expect(taskCreationFailure({ code: "42501" })).toEqual({
      message: "You don't have permission to create tasks.",
      shouldLog: false,
    });
    expect(
      taskCreationFailure({
        code: "P0001",
        message: "Only a manager can create tasks.",
      }),
    ).toEqual({
      message: "Only a manager can create tasks.",
      shouldLog: false,
    });
  });

  it("returns a safe message and marks unexpected database errors for logging", () => {
    expect(
      taskCreationFailure({
        code: "42P17",
        message: "Internal database details are not user-facing.",
      }),
    ).toEqual({
      message: "We couldn't create this task. Please try again.",
      shouldLog: true,
    });
  });
});

type PostgresErrorLike = {
  code?: string;
  message?: string;
};

export function taskCreationValidationMessage(
  field: string | number | undefined,
): string {
  switch (field) {
    case "title":
      return "Enter a task title.";
    case "instructions":
      return "Enter task instructions.";
    case "dueDate":
      return "Choose a valid due date.";
    case "assigneeId":
      return "Select a member to assign this task.";
    default:
      return "Check the task details and try again.";
  }
}

export function taskCreationFailure(error: unknown): {
  message: string;
  shouldLog: boolean;
} {
  const databaseError =
    typeof error === "object" && error !== null
      ? (error as PostgresErrorLike)
      : {};

  if (databaseError.code === "42501") {
    return {
      message: "You don't have permission to create tasks.",
      shouldLog: false,
    };
  }

  if (databaseError.code === "P0001") {
    return {
      message: databaseError.message?.trim() || "This task cannot be created.",
      shouldLog: false,
    };
  }

  return {
    message: "We couldn't create this task. Please try again.",
    shouldLog: true,
  };
}

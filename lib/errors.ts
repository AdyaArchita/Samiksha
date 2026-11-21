type PostgresErrorLike = {
  code?: string;
};

export function friendlyPostgresError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null
      ? (error as PostgresErrorLike).code
      : undefined;

  if (code === "42501") {
    return "You do not have permission to perform this action.";
  }
  if (code === "P0001") {
    return "This action is not allowed in the task's current state.";
  }
  if (code === "23505") {
    return "This item has already been submitted or reviewed.";
  }

  return "The action could not be completed. Please try again.";
}

export function logDatabaseError(error: unknown, code?: string) {
  if (typeof error === "object" && error !== null) {
    const pgError = error as PostgresErrorLike;
    console.error("Database error", code ?? pgError.code ?? "unknown");
  } else {
    console.error("Database error", code ?? "unknown");
  }
}

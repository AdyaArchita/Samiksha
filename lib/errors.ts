type PostgresErrorLike = {
  code?: string;
  message?: string;
};

export function friendlyPostgresError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null
      ? (error as PostgresErrorLike).code
      : undefined;

  if (code === "42501") {
    return "You don't have permission to do that.";
  }
  if (code === "P0001") {
    const message =
      typeof error === "object" && error !== null
        ? (error as PostgresErrorLike).message
        : undefined;
    return message?.trim() || "This action is not allowed.";
  }
  if (code === "23505") {
    return "This version was already submitted, please refresh.";
  }

  return "Something went wrong. Please try again.";
}

export function logDatabaseError(error: unknown, code?: string) {
  if (typeof error === "object" && error !== null) {
    const pgError = error as PostgresErrorLike;
    console.error("Database error", code ?? pgError.code ?? "unknown");
  } else {
    console.error("Database error", code ?? "unknown");
  }
}

import { describe, expect, it } from "vitest";
import { friendlyPostgresError } from "../../lib/errors";

describe("friendly database error messages", () => {
  it("maps RLS and privilege errors", () => {
    expect(friendlyPostgresError({ code: "42501" })).toBe(
      "You don't have permission to do that.",
    );
  });

  it("shows a clear database trigger message", () => {
    expect(
      friendlyPostgresError({
        code: "P0001",
        message: "Only submitted tasks can be reviewed.",
      }),
    ).toBe("Only submitted tasks can be reviewed.");
  });

  it("maps duplicate-version errors", () => {
    expect(friendlyPostgresError({ code: "23505" })).toBe(
      "This version was already submitted, please refresh.",
    );
  });

  it("uses a generic message for unknown errors", () => {
    expect(friendlyPostgresError({ code: "08006" })).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  buildTaskHistory,
  countTaskStatuses,
  filterTasks,
  parseTaskFilter,
  sortTasks,
} from "../../lib/task-presentation";
import type { Review, Submission, Task } from "../../lib/types";

const task = (id: string, status: Task["status"]): Task => ({
  id,
  title: `Task ${id}`,
  instructions: "Complete the requested work.",
  due_date: "2026-12-01",
  status,
  manager_id: "manager-id",
  assignee_id: "member-id",
  created_at: `2026-11-${id === "1" ? "01" : "02"}T10:00:00.000Z`,
  updated_at: "2026-11-02T10:00:00.000Z",
});

describe("task presentation helpers", () => {
  it("parses supported status filters and falls back to all", () => {
    expect(parseTaskFilter("changes_requested")).toBe("changes_requested");
    expect(parseTaskFilter(["approved", "assigned"])).toBe("approved");
    expect(parseTaskFilter("unknown")).toBe("all");
  });

  it("counts and filters task statuses", () => {
    const tasks = [task("1", "assigned"), task("2", "submitted")];
    expect(countTaskStatuses(tasks)).toEqual({
      assigned: 1,
      submitted: 1,
      changes_requested: 0,
      approved: 0,
    });
    expect(filterTasks(tasks, "submitted").map(({ id }) => id)).toEqual(["2"]);
  });

  it("prioritizes submitted tasks for managers and changes requested for members", () => {
    const tasks = [
      task("1", "assigned"),
      task("2", "submitted"),
      task("3", "changes_requested"),
    ];
    expect(sortTasks(tasks, "manager").map(({ status }) => status)).toEqual([
      "submitted",
      "changes_requested",
      "assigned",
    ]);
    expect(sortTasks(tasks, "member").map(({ status }) => status)).toEqual([
      "changes_requested",
      "submitted",
      "assigned",
    ]);
  });

  it("keeps every submission and review in chronological task history", () => {
    const currentTask = task("1", "approved");
    const submissions: Submission[] = [
      {
        id: "submission-1",
        task_id: currentTask.id,
        author_id: "member-id",
        version: 1,
        body: "First version",
        link: null,
        file_path: null,
        created_at: "2026-11-02T10:00:00.000Z",
      },
      {
        id: "submission-2",
        task_id: currentTask.id,
        author_id: "member-id",
        version: 2,
        body: "Revised version",
        link: null,
        file_path: null,
        created_at: "2026-11-04T10:00:00.000Z",
      },
    ];
    const reviews: Review[] = [
      {
        id: "review-1",
        task_id: currentTask.id,
        submission_id: submissions[0].id,
        reviewer_id: "manager-id",
        decision: "changes_requested",
        feedback: "Add supporting detail.",
        created_at: "2026-11-03T10:00:00.000Z",
      },
      {
        id: "review-2",
        task_id: currentTask.id,
        submission_id: submissions[1].id,
        reviewer_id: "manager-id",
        decision: "approved",
        feedback: null,
        created_at: "2026-11-05T10:00:00.000Z",
      },
    ];

    const history = buildTaskHistory(
      currentTask,
      submissions,
      reviews,
      "member",
    );
    expect(history.map(({ title }) => title)).toEqual([
      "Assigned",
      "Submitted",
      "Changes requested",
      "Resubmitted",
      "Approved",
    ]);
    expect(history[2].feedback).toBe("Add supporting detail.");
    expect(
      history.flatMap((event) => event.submission ? [event.submission.body] : []),
    ).toEqual(["First version", "Revised version"]);
  });
});

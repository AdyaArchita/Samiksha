import { describe, expect, it } from "vitest";
import {
  buildTaskListHref,
  buildTaskHistory,
  countTaskStatuses,
  filterTasks,
  filterTasksByQuery,
  formatRelativeTime,
  getInitials,
  getTaskDueInfo,
  parseTaskFilter,
  parseTaskSort,
  sortTaskList,
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
  it("creates initials from names and email addresses", () => {
    expect(getInitials("Ria Mehta")).toBe("RM");
    expect(getInitials("ria.mehta@example.test")).toBe("RM");
    expect(getInitials("ria@example.test")).toBe("R");
    expect(getInitials("  ")).toBe("");
  });

  it.each([
    ["today", "2026-11-21", "assigned", "Nov 21, 2026", "today", false, true],
    ["tomorrow", "2026-11-22", "assigned", "Nov 22, 2026", "tomorrow", false, true],
    ["future", "2026-11-28", "assigned", "Nov 28, 2026", "in 7 days", false, false],
    ["overdue", "2026-11-19", "changes_requested", "Nov 19, 2026", "Overdue by 2 days", true, false],
    ["approved", "2026-11-19", "approved", "Nov 19, 2026", null, false, false],
  ] as const)(
    "formats the %s due state consistently",
    (_case, dueDate, status, formattedDate, relativeLabel, overdue, dueSoon) => {
      expect(getTaskDueInfo(dueDate, status, "2026-11-21")).toMatchObject({
        formattedDate,
        relativeLabel,
        overdue,
        dueSoon,
      });
    },
  );

  it("marks tasks due within 48 hours but not approved as due soon", () => {
    expect(
      getTaskDueInfo("2026-11-23", "assigned", "2026-11-21T23:59:59.999Z").dueSoon,
    ).toBe(true);
    expect(
      getTaskDueInfo("2026-11-24", "assigned", "2026-11-21T23:59:59.999Z").dueSoon,
    ).toBe(false);
    expect(
      getTaskDueInfo("2026-11-20", "assigned", "2026-11-21T23:59:59.999Z").dueSoon,
    ).toBe(false);
    expect(
      getTaskDueInfo("2026-11-22", "approved", "2026-11-21T23:59:59.999Z").dueSoon,
    ).toBe(false);
  });

  it("formats update timestamps relatively", () => {
    expect(
      formatRelativeTime(
        "2026-11-19T10:00:00.000Z",
        "2026-11-21T10:00:00.000Z",
      ),
    ).toBe("2 days ago");
  });

  it("parses supported status filters and falls back to all", () => {
    expect(parseTaskFilter("changes_requested")).toBe("changes_requested");
    expect(parseTaskFilter(["approved", "assigned"])).toBe("approved");
    expect(parseTaskFilter("unknown")).toBe("all");
  });

  it("parses sort options and falls back to soonest due date", () => {
    expect(parseTaskSort("due_desc")).toBe("due_desc");
    expect(parseTaskSort(["updated_desc", "due_desc"])).toBe("updated_desc");
    expect(parseTaskSort("unknown")).toBe("due_asc");
  });

  it("filters task titles and assignee details without regard to case", () => {
    const tasks = [
      { ...task("1", "assigned"), title: "Write quarterly report", assignee_id: "member-1" },
      { ...task("2", "submitted"), title: "Review mockups", assignee_id: "member-2" },
    ];
    const assigneeTerms = new Map([
      ["member-1", "Ria Example ria@example.test"],
      ["member-2", "Morgan Lee morgan@example.test"],
    ]);

    expect(filterTasksByQuery(tasks, "QUARTERLY", assigneeTerms).map(({ id }) => id))
      .toEqual(["1"]);
    expect(filterTasksByQuery(tasks, "morgan@example.test", assigneeTerms).map(({ id }) => id))
      .toEqual(["2"]);
  });

  it("sorts by due date or update time and keeps filter query parameters in links", () => {
    const tasks = [
      {
        ...task("1", "assigned"),
        due_date: "2026-12-03",
        updated_at: "2026-11-20T10:00:00.000Z",
      },
      {
        ...task("2", "submitted"),
        due_date: "2026-11-28",
        updated_at: "2026-11-22T10:00:00.000Z",
      },
    ];

    expect(sortTaskList(tasks, "due_asc", "manager").map(({ id }) => id)).toEqual(["2", "1"]);
    expect(sortTaskList(tasks, "due_desc", "manager").map(({ id }) => id)).toEqual(["1", "2"]);
    expect(sortTaskList(tasks, "updated_desc", "manager").map(({ id }) => id)).toEqual(["2", "1"]);
    expect(
      buildTaskListHref("/member", {
        status: "submitted",
        query: "ria example",
        sort: "updated_desc",
      }),
    ).toBe("/member?status=submitted&q=ria+example&sort=updated_desc");
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

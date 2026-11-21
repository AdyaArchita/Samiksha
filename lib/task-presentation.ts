import type { Review, Submission, Task, TaskStatus, UserRole } from "@/lib/types";

export type TaskFilter = "all" | TaskStatus;
export type TaskSort = "due_asc" | "due_desc" | "updated_desc";

export type TaskHistoryEvent = {
  id: string;
  kind: "assigned" | "submitted" | "resubmitted" | "changes_requested" | "approved";
  title: string;
  actor: string;
  createdAt: string;
  description?: string;
  feedback?: string | null;
  submission?: Submission;
};

const managerPriority: Record<TaskStatus, number> = {
  submitted: 0,
  changes_requested: 1,
  assigned: 2,
  approved: 3,
};

const memberPriority: Record<TaskStatus, number> = {
  changes_requested: 0,
  submitted: 1,
  assigned: 2,
  approved: 3,
};

export function parseTaskFilter(value?: string | string[]): TaskFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    candidate === "assigned"
    || candidate === "submitted"
    || candidate === "changes_requested"
    || candidate === "approved"
  ) {
    return candidate;
  }
  return "all";
}

export function parseTaskSort(value?: string | string[]): TaskSort {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "due_desc" || candidate === "updated_desc"
    ? candidate
    : "due_asc";
}

export function buildTaskListHref(
  pathname: string,
  {
    status,
    query,
    sort,
  }: {
    status?: TaskFilter;
    query?: string;
    sort?: TaskSort;
  },
): string {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const normalizedQuery = query?.trim();
  if (normalizedQuery) params.set("q", normalizedQuery);
  if (sort && sort !== "due_asc") params.set("sort", sort);
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function filterTasksByQuery(
  tasks: Task[],
  query: string,
  assigneeTerms: ReadonlyMap<string, string>,
): Task[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return tasks;

  return tasks.filter((task) =>
    task.title.toLocaleLowerCase().includes(normalizedQuery)
    || (assigneeTerms.get(task.assignee_id) ?? "")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function getTaskDueInfo(
  dueDate: string | null,
  status: TaskStatus,
  today: string,
): {
  formattedDate: string | null;
  relativeLabel: string | null;
  overdue: boolean;
} {
  if (!dueDate) {
    return { formattedDate: null, relativeLabel: null, overdue: false };
  }

  const dueTimestamp = Date.parse(`${dueDate}T00:00:00.000Z`);
  const todayTimestamp = Date.parse(`${today}T00:00:00.000Z`);
  if (!Number.isFinite(dueTimestamp) || !Number.isFinite(todayTimestamp)) {
    return { formattedDate: dueDate, relativeLabel: null, overdue: false };
  }

  const daysUntil = Math.round((dueTimestamp - todayTimestamp) / 86_400_000);
  const overdue = status !== "approved" && daysUntil < 0;
  const relativeLabel = overdue
    ? `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? "day" : "days"}`
    : daysUntil < 0
      ? null
      : daysUntil === 0
        ? "today"
        : daysUntil === 1
          ? "tomorrow"
          : `in ${daysUntil} days`;

  return {
    formattedDate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(dueTimestamp),
    relativeLabel,
    overdue,
  };
}

export function formatRelativeTime(timestamp: string, now: string): string | null {
  const elapsedSeconds = Math.floor((Date.parse(now) - Date.parse(timestamp)) / 1000);
  if (!Number.isFinite(elapsedSeconds)) return null;
  if (elapsedSeconds < 60) return "just now";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return `${elapsedMonths} ${elapsedMonths === 1 ? "month" : "months"} ago`;
  }

  const elapsedYears = Math.floor(elapsedMonths / 12);
  return `${elapsedYears} ${elapsedYears === 1 ? "year" : "years"} ago`;
}

export function countTaskStatuses(tasks: Task[]): Record<TaskStatus, number> {
  return tasks.reduce(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    {
      assigned: 0,
      submitted: 0,
      changes_requested: 0,
      approved: 0,
    },
  );
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return filter === "all" ? tasks : tasks.filter((task) => task.status === filter);
}

export function sortTaskList(
  tasks: Task[],
  sort: TaskSort,
  role: UserRole,
): Task[] {
  const priority = role === "manager" ? managerPriority : memberPriority;
  return [...tasks].sort((left, right) => {
    const primary =
      sort === "due_desc"
        ? right.due_date.localeCompare(left.due_date)
        : sort === "updated_desc"
          ? right.updated_at.localeCompare(left.updated_at)
          : left.due_date.localeCompare(right.due_date);

    return primary
      || priority[left.status] - priority[right.status]
      || right.created_at.localeCompare(left.created_at);
  });
}

export function sortTasks(tasks: Task[], role: UserRole): Task[] {
  const priority = role === "manager" ? managerPriority : memberPriority;
  return [...tasks].sort(
    (left, right) =>
      priority[left.status] - priority[right.status]
      || left.due_date.localeCompare(right.due_date)
      || right.created_at.localeCompare(left.created_at),
  );
}

export function buildTaskHistory(
  task: Task,
  submissions: Submission[],
  reviews: Review[],
  viewerRole: UserRole,
): TaskHistoryEvent[] {
  const events: TaskHistoryEvent[] = [
    {
      id: `assigned-${task.id}`,
      kind: "assigned",
      title: "Assigned",
      actor: viewerRole === "manager" ? "You" : "Manager",
      createdAt: task.created_at,
      description: viewerRole === "manager" ? "Assigned to a member" : "Assigned to you",
      feedback: null,
    },
    ...submissions.map((submission) => ({
      id: `submission-${submission.id}`,
      kind: submission.version === 1 ? "submitted" as const : "resubmitted" as const,
      title: submission.version === 1 ? "Submitted" : "Resubmitted",
      actor: viewerRole === "member" ? "You" : "Member",
      createdAt: submission.created_at,
      feedback: null,
      submission,
    })),
    ...reviews.map((review) => ({
      id: `review-${review.id}`,
      kind: review.decision,
      title: review.decision === "approved" ? "Approved" : "Changes requested",
      actor: viewerRole === "manager" ? "You" : "Manager",
      createdAt: review.created_at,
      feedback: review.feedback,
    })),
  ];

  return events.sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );
}

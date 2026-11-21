import type { Review, Submission, Task, TaskStatus, UserRole } from "@/lib/types";

export type TaskFilter = "all" | TaskStatus;

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

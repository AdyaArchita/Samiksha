export type UserRole = "manager" | "member";
export type TaskStatus = "assigned" | "submitted" | "changes_requested" | "approved";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  instructions: string;
  due_date: string;
  status: TaskStatus;
  manager_id: string;
  assignee_id: string;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  task_id: string;
  author_id: string;
  version: number;
  body: string;
  link: string | null;
  file_path: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  task_id: string;
  submission_id: string;
  reviewer_id: string;
  decision: "approved" | "changes_requested";
  feedback: string | null;
  created_at: string;
};

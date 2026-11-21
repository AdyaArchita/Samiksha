-- 001_schema.sql
-- Creates the core tables and append-only history constraints.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null,
  full_name text not null default '',
  role text not null default 'member'
    constraint profiles_role_check check (role in ('manager', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  instructions text not null check (btrim(instructions) <> ''),
  due_date date not null,
  status text not null default 'assigned'
    constraint tasks_status_check
    check (status in ('assigned', 'submitted', 'changes_requested', 'approved')),
  manager_id uuid not null references public.profiles(id) on delete restrict,
  assignee_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_manager_assignee_different check (manager_id <> assignee_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  body text not null check (btrim(body) <> ''),
  link text,
  file_path text,
  created_at timestamptz not null default now(),
  constraint submissions_task_version_unique unique (task_id, version),
  constraint submissions_id_task_unique unique (id, task_id),
  constraint submissions_http_link_check
    check (
      link is null
      or (
        btrim(link) = link
        and link ~* '^https?://[^[:space:]]+$'
      )
    )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  submission_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null
    constraint reviews_decision_check
    check (decision in ('approved', 'changes_requested')),
  feedback text,
  created_at timestamptz not null default now(),
  constraint reviews_one_per_submission unique (submission_id),
  constraint reviews_submission_task_fkey
    foreign key (submission_id, task_id)
    references public.submissions(id, task_id)
    on delete restrict,
  constraint reviews_changes_feedback_check
    check (
      decision <> 'changes_requested'
      or (feedback is not null and btrim(feedback) <> '')
    )
);

-- Foreign-key indexes keep task-party lookups and history queries efficient.
create index if not exists tasks_manager_id_idx on public.tasks(manager_id);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists submissions_author_id_idx on public.submissions(author_id);
create index if not exists reviews_task_id_idx on public.reviews(task_id);
create index if not exists reviews_reviewer_id_idx on public.reviews(reviewer_id);

-- Authenticated users may insert history rows, but cannot rewrite or remove history.
revoke update, delete on public.submissions from authenticated;
revoke update, delete on public.reviews from authenticated;
revoke update, delete on public.tasks from authenticated;

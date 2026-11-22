-- 003_rls.sql
-- Row Level Security for profiles, tasks, submissions, and reviews.

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.tasks to authenticated;
grant select on public.submissions to authenticated;
grant select on public.reviews to authenticated;

-- Column-level INSERT grants prevent clients from supplying state or timestamps.
revoke insert on public.tasks from authenticated;
revoke insert on public.submissions from authenticated;
revoke insert on public.reviews from authenticated;
grant insert (title, instructions, due_date, manager_id, assignee_id)
  on public.tasks to authenticated;
grant insert (id, task_id, author_id, body, link, file_path)
  on public.submissions to authenticated;
grant insert (task_id, submission_id, reviewer_id, decision, feedback)
  on public.reviews to authenticated;

-- Profiles: users see their own profile.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

-- Managers can read member profiles to populate the task assignee picker.
drop policy if exists "profiles_managers_read_members" on public.profiles;
create policy "profiles_managers_read_members"
on public.profiles for select
to authenticated
using (
  role = 'member'
  and public.is_manager()
);

-- Members can read the manager profile on tasks assigned to them.
drop policy if exists "profiles_read_own_task_manager" on public.profiles;
create policy "profiles_read_own_task_manager"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where assignee_id = (select auth.uid())
      and manager_id = profiles.id
  )
);

-- Task parties can see a task; this shows managers only their work and members only assignments.
drop policy if exists "tasks_party_select" on public.tasks;
create policy "tasks_party_select"
on public.tasks for select
to authenticated
using (
  manager_id = (select auth.uid())
  or assignee_id = (select auth.uid())
);

-- Only managers can create assigned tasks owned by themselves and assigned to members.
drop policy if exists "tasks_manager_insert" on public.tasks;
create policy "tasks_manager_insert"
on public.tasks for insert
to authenticated
with check (
  public.is_manager()
  and manager_id = (select auth.uid())
  and status = 'assigned'
  and exists (
    select 1
    from public.profiles
    where id = assignee_id
      and role = 'member'
  )
);

-- Only the manager and assignee can read a task's submission history.
drop policy if exists "submissions_party_select" on public.submissions;
create policy "submissions_party_select"
on public.submissions for select
to authenticated
using (
  public.is_task_party(task_id)
);

-- Only the assigned member can submit while the task accepts submissions.
drop policy if exists "submissions_assignee_insert" on public.submissions;
create policy "submissions_assignee_insert"
on public.submissions for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.tasks
    where id = submissions.task_id
      and assignee_id = (select auth.uid())
      and status in ('assigned', 'changes_requested')
  )
);

-- Only the manager and assignee can read review history.
drop policy if exists "reviews_party_select" on public.reviews;
create policy "reviews_party_select"
on public.reviews for select
to authenticated
using (
  public.is_task_party(task_id)
);

-- Only the owner manager may review the latest submission while it is submitted.
drop policy if exists "reviews_manager_insert" on public.reviews;
create policy "reviews_manager_insert"
on public.reviews for insert
to authenticated
with check (
  public.is_manager()
  and reviewer_id = (select auth.uid())
  and exists (
    select 1
    from public.tasks
    where id = reviews.task_id
      and manager_id = (select auth.uid())
      and status = 'submitted'
  )
  and exists (
    select 1
    from public.submissions
    where id = reviews.submission_id
      and task_id = reviews.task_id
      and version = (
        select max(s.version)
        from public.submissions s
        where s.task_id = reviews.task_id
      )
  )
);

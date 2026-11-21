-- 003_rls.sql
-- Row Level Security for profiles, tasks, submissions, and reviews.

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.tasks to authenticated;
grant select, insert on public.submissions to authenticated;
grant select, insert on public.reviews to authenticated;

-- Profiles: users see themselves. Managers see members for assignment.
-- Members see the manager profile only on tasks assigned to them.
create policy "profiles_self_select"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles_managers_read_members"
on public.profiles for select
to authenticated
using (
  role = 'member'
  and public.is_manager()
);

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

-- Tasks: managers see owned work; members see only assigned work.
create policy "tasks_party_select"
on public.tasks for select
to authenticated
using (
  manager_id = (select auth.uid())
  or assignee_id = (select auth.uid())
);

-- Tasks: only managers may create them, owned by themselves, for members.
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

-- Submission history: only the two parties on the task may read it.
create policy "submissions_party_select"
on public.submissions for select
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where id = submissions.task_id
      and (
        manager_id = (select auth.uid())
        or assignee_id = (select auth.uid())
      )
  )
);

-- Submission inserts: author must be assignee and task must accept a submission.
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

-- Reviews: only task parties can read history.
create policy "reviews_party_select"
on public.reviews for select
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where id = reviews.task_id
      and (
        manager_id = (select auth.uid())
        or assignee_id = (select auth.uid())
      )
  )
);

-- Reviews: only the owner manager may review the latest submission while submitted.
create policy "reviews_manager_insert"
on public.reviews for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
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

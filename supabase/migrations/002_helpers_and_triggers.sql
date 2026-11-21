-- 002_helpers_and_triggers.sql
-- Secure helpers and trigger-only status transitions.

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'manager'
  );
$$;

create or replace function public.is_task_party(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks
    where id = p_task_id
      and (manager_id = (select auth.uid()) or assignee_id = (select auth.uid()))
  );
$$;

revoke all on function public.is_manager() from public;
revoke all on function public.is_task_party(uuid) from public;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.is_task_party(uuid) to authenticated;

-- This trigger creates a profile immediately after signup.
-- Metadata can choose the demo role; otherwise every account starts as member.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'member');
  if requested_role not in ('manager', 'member') then
    requested_role := 'member';
  end;

  insert into public.profiles(id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- The before trigger assigns a monotonic version and validates submission-level rules.
create or replace function public.before_submission_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_record public.tasks%rowtype;
begin
  select * into task_record
  from public.tasks
  where id = new.task_id
  for update;

  if not found then
    raise exception 'Task was not found.' using errcode = 'P0001';
  end;

  if new.author_id <> task_record.assignee_id then
    raise exception 'Only the assigned member can submit this task.'
      using errcode = 'P0001';
  end;

  if new.author_id <> (select auth.uid()) then
    raise exception 'You cannot submit work as another user.'
      using errcode = 'P0001';
  end;

  if task_record.status not in ('assigned', 'changes_requested') then
    raise exception 'This task is not accepting submissions.'
      using errcode = 'P0001';
  end;

  if new.link is not null
     and new.link !~* '^https?://[^[:space:]$]+$' then
    raise exception 'Links must start with http:// or https://.'
      using errcode = 'P0001';
  end;

  select coalesce(max(version), 0) + 1
  into new.version
  from public.submissions
  where task_id = new.task_id;

  return new;
end;
$$;

drop trigger if exists submissions_assign_version on public.submissions;
create trigger submissions_assign_version
before insert on public.submissions
for each row execute function public.before_submission_insert();

-- The after trigger changes status in the same transaction as submission history.
create or replace function public.after_submission_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  select status into current_status
  from public.tasks
  where id = new.task_id
  for update;

  if current_status not in ('assigned', 'changes_requested') then
    raise exception 'Invalid submission transition: task cannot be resubmitted.'
      using errcode = 'P0001';
  end;

  update public.tasks
  set status = 'submitted',
      updated_at = timezone('utc', now())
  where id = new.task_id;

  return null;
end;
$$;

drop trigger if exists submissions_update_task_status on public.submissions;
create trigger submissions_update_task_status
after insert on public.submissions
for each row execute function public.after_submission_insert();

-- Reviews are validated against ownership, submitted status, and latest version.
create or replace function public.after_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_record public.tasks%rowtype;
  latest_submission_id uuid;
begin
  select * into task_record
  from public.tasks
  where id = new.task_id
  for update;

  if not found then
    raise exception 'Task was not found.' using errcode = 'P0001';
  end;

  if new.reviewer_id <> task_record.manager_id
     or new.reviewer_id <> (select auth.uid()) then
    raise exception 'Only the task manager can review this submission.'
      using errcode = 'P0001';
  end;

  if task_record.status <> 'submitted' then
    raise exception 'Only submitted tasks can be reviewed.'
      using errcode = 'P0001';
  end;

  select id into latest_submission_id
  from public.submissions
  where task_id = new.task_id
  order by version desc
  limit 1;

  if new.submission_id <> latest_submission_id then
    raise exception 'Reviews must target the latest submission.'
      using errcode = 'P0001';
  end;

  if not exists (
    select 1
    from public.submissions
    where id = new.submission_id
      and task_id = new.task_id
  ) then
    raise exception 'The submission does not belong to this task.'
      using errcode = 'P0001';
  end;

  if new.decision = 'changes_requested'
     and (new.feedback is null or btrim(new.feedback) = '') then
    raise exception 'Written feedback is required when changes are requested.'
      using errcode = 'P0001';
  end;

  if new.decision not in ('approved', 'changes_requested') then
    raise exception 'Invalid review decision.' using errcode = 'P0001';
  end;

  update public.tasks
  set status = new.decision,
      updated_at = timezone('utc', now())
  where id = new.task_id;

  return null;
end;
$$;

drop trigger if exists reviews_update_task_status on public.reviews;
create trigger reviews_update_task_status
after insert on public.reviews
for each row execute function public.after_review_insert();

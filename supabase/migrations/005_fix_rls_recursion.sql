-- Break the profiles <-> tasks RLS recursion with scoped SECURITY DEFINER helpers.

create or replace function public.can_assign_member(p_assignee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manager()
    and exists (
      select 1
      from public.profiles
      where id = p_assignee_id
        and role = 'member'
    );
$$;

create or replace function public.is_assigned_to_manager(p_manager_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks
    where manager_id = p_manager_id
      and assignee_id = (select auth.uid())
  );
$$;

revoke all on function public.can_assign_member(uuid) from public;
revoke all on function public.can_assign_member(uuid) from anon;
grant execute on function public.can_assign_member(uuid) to authenticated;

revoke all on function public.is_assigned_to_manager(uuid) from public;
revoke all on function public.is_assigned_to_manager(uuid) from anon;
grant execute on function public.is_assigned_to_manager(uuid) to authenticated;

drop policy if exists "profiles_read_own_task_manager" on public.profiles;
create policy "profiles_read_own_task_manager"
on public.profiles for select
to authenticated
using (
  role = 'manager'
  and public.is_assigned_to_manager(id)
);

drop policy if exists "tasks_manager_insert" on public.tasks;
create policy "tasks_manager_insert"
on public.tasks for insert
to authenticated
with check (
  public.is_manager()
  and manager_id = (select auth.uid())
  and status = 'assigned'
  and public.can_assign_member(assignee_id)
);

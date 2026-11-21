-- 005_fixes.sql
-- Correct the storage object path format and make the optional due date explicit.

alter table public.tasks
  alter column due_date drop not null;

drop policy if exists "submission_files_assignee_upload" on storage.objects;

-- The app uploads as {task_id}/{submission_id}/{filename}.
-- This policy accepts only that three-part private path and an eligible assignee.
create policy "submission_files_assignee_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'submission-files'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
  and exists (
    select 1
    from public.tasks
    where id::text = (storage.foldername(name))[1]
      and assignee_id = (select auth.uid())
      and status in ('assigned', 'changes_requested')
  )
);

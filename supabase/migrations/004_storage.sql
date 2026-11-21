-- 004_storage.sql
-- Private file bucket and task-party Storage access mirrored from table rules.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-files',
  'submission-files',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Assignees can upload private files only for an open task, using
-- {task_id}/{submission_id}/{filename}; no overwrite/update/delete policy is granted.
drop policy if exists "submission_files_assignee_upload" on storage.objects;
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

-- Task parties can read stored objects, which the app serves using signed URLs.
drop policy if exists "submission_files_party_read" on storage.objects;
create policy "submission_files_party_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'submission-files'
  and case
    when (storage.foldername(name))[1]
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_task_party(((storage.foldername(name))[1])::uuid)
    else false
  end
);

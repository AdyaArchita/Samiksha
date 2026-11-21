-- Run with psql -v manager_id=<uuid> -v member_a_id=<uuid> -v member_b_id=<uuid>.
-- The test transaction runs as authenticated and rolls back all task/history rows.
\set ON_ERROR_STOP on

\if :{?manager_id}
\else
\echo 'FAIL: pass manager_id with -v manager_id=<uuid>'
\quit 2
\endif
\if :{?member_a_id}
\else
\echo 'FAIL: pass member_a_id with -v member_a_id=<uuid>'
\quit 2
\endif
\if :{?member_b_id}
\else
\echo 'FAIL: pass member_b_id with -v member_b_id=<uuid>'
\quit 2
\endif

begin;
set local role authenticated;

do $$
begin
  if current_user <> 'authenticated' then
    raise exception 'RLS regression checks must run as authenticated.';
  end if;
  raise notice 'PASS: checks execute as authenticated';
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'manager_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
select set_config('rls_regression.manager_id', :'manager_id', true) as _manager \gset
select set_config('rls_regression.member_a_id', :'member_a_id', true) as _member_a \gset
select set_config('rls_regression.member_b_id', :'member_b_id', true) as _member_b \gset

insert into public.tasks (title, instructions, due_date, manager_id, assignee_id)
values (
  'RLS regression task A',
  'Assigned to member A.',
  current_date + 7,
  current_setting('rls_regression.manager_id')::uuid,
  current_setting('rls_regression.member_a_id')::uuid
)
returning id as task_a_id \gset
select set_config('rls_regression.task_a_id', :'task_a_id', true) as _task_a \gset
\echo 'PASS: manager created and assigned task A'

insert into public.tasks (title, instructions, due_date, manager_id, assignee_id)
values (
  'RLS regression task B',
  'Assigned to member B.',
  current_date + 7,
  current_setting('rls_regression.manager_id')::uuid,
  current_setting('rls_regression.member_b_id')::uuid
)
returning id as task_b_id \gset
select set_config('rls_regression.task_b_id', :'task_b_id', true) as _task_b \gset
\echo 'PASS: manager created and assigned task B'

do $$
begin
  if (
    select count(*)
    from public.profiles
    where id in (
      current_setting('rls_regression.member_a_id')::uuid,
      current_setting('rls_regression.member_b_id')::uuid
    )
      and role = 'member'
  ) <> 2 then
    raise exception 'Manager could not read both member profiles.';
  end if;
  raise notice 'PASS: manager can read member profiles';
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'member_b_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
insert into public.submissions (task_id, author_id, body)
values (
  current_setting('rls_regression.task_b_id')::uuid,
  current_setting('rls_regression.member_b_id')::uuid,
  'Member B private submission.'
)
returning id as submission_b_id \gset
select set_config(
  'rls_regression.submission_b_id',
  :'submission_b_id',
  true
) as _submission_b \gset
\echo 'PASS: member B can submit to task B'

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'member_a_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
select gen_random_uuid()::text as submission_a1_id \gset
select set_config(
  'rls_regression.submission_a1_id',
  :'submission_a1_id',
  true
) as _submission_a1 \gset
select set_config(
  'rls_regression.file_path',
  current_setting('rls_regression.task_a_id')
    || '/'
    || current_setting('rls_regression.submission_a1_id')
    || '/rls-test.txt',
  true
) as _file_path \gset
insert into storage.objects (bucket_id, name)
values (
  'submission-files',
  current_setting('rls_regression.file_path')
);
\echo 'PASS: member A can upload an attachment for its open task'

insert into public.submissions (id, task_id, author_id, body, file_path)
values (
  current_setting('rls_regression.submission_a1_id')::uuid,
  current_setting('rls_regression.task_a_id')::uuid,
  current_setting('rls_regression.member_a_id')::uuid,
  'Member A version one.',
  current_setting('rls_regression.file_path')
);
\echo 'PASS: member A can submit to task A'

do $$
begin
  if not exists (
    select 1
    from storage.objects
    where name = current_setting('rls_regression.file_path')
  ) then
    raise exception 'Member A cannot read its own attachment.';
  end if;
  raise notice 'PASS: member A can read its own attachment';
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'member_b_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
do $$
begin
  if exists (
    select 1
    from storage.objects
    where name = current_setting('rls_regression.file_path')
  ) then
    raise exception 'Member B can read member A attachment.';
  end if;
  raise notice 'PASS: member B cannot read member A attachment';
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'member_a_id', 'role', 'authenticated')::text,
  true
) as _claims \gset

do $$
begin
  if (
    select count(*)
    from public.tasks
    where id in (
      current_setting('rls_regression.task_a_id')::uuid,
      current_setting('rls_regression.task_b_id')::uuid
    )
  ) <> 1
    or not exists (
      select 1
      from public.tasks
      where id = current_setting('rls_regression.task_a_id')::uuid
    )
  then
    raise exception 'Member A can read another member task or cannot read its own.';
  end if;

  if exists (
    select 1
    from public.submissions
    where id = current_setting('rls_regression.submission_b_id')::uuid
  ) then
    raise exception 'Member A can read member B submission.';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = current_setting('rls_regression.member_b_id')::uuid
  ) then
    raise exception 'Member A can read member B profile data.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_setting('rls_regression.manager_id')::uuid
      and role = 'manager'
  ) then
    raise exception 'Member A cannot read the manager profile for its own task.';
  end if;

  raise notice 'PASS: member A sees only its task, submission, and task manager';
end;
$$;

do $$
begin
  begin
    update public.tasks
    set title = 'Unauthorized task edit'
    where id = current_setting('rls_regression.task_b_id')::uuid;
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot modify member B task';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot modify member B task';
  end;

  begin
    update public.submissions
    set body = 'Unauthorized submission edit'
    where id = current_setting('rls_regression.submission_b_id')::uuid;
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot modify member B submission';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot modify member B submission';
  end;

  begin
    insert into public.submissions (task_id, author_id, body)
    values (
      current_setting('rls_regression.task_b_id')::uuid,
      current_setting('rls_regression.member_a_id')::uuid,
      'Unauthorized cross-member submission.'
    );
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot submit to member B task';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot submit to member B task';
  end;

  begin
    insert into public.tasks (title, instructions, due_date, manager_id, assignee_id)
    values (
      'Unauthorized task',
      'A member must not create tasks.',
      current_date + 7,
      current_setting('rls_regression.manager_id')::uuid,
      current_setting('rls_regression.member_b_id')::uuid
    );
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot create tasks';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot create tasks';
  end;
end;
$$;

do $$
begin
  begin
    insert into public.reviews (task_id, submission_id, reviewer_id, decision)
    values (
      current_setting('rls_regression.task_a_id')::uuid,
      current_setting('rls_regression.submission_a1_id')::uuid,
      current_setting('rls_regression.member_a_id')::uuid,
      'approved'
    );
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot approve submissions';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot approve submissions';
  end;

  begin
    insert into public.reviews (
      task_id, submission_id, reviewer_id, decision, feedback
    )
    values (
      current_setting('rls_regression.task_a_id')::uuid,
      current_setting('rls_regression.submission_a1_id')::uuid,
      current_setting('rls_regression.member_a_id')::uuid,
      'changes_requested',
      'Unauthorized review.'
    );
    raise exception 'rls_regression_unexpected_success' using errcode = 'P0001';
  exception
    when insufficient_privilege then
      raise notice 'PASS: member A cannot request changes';
    when raise_exception then
      if sqlerrm = 'rls_regression_unexpected_success' then
        raise;
      end if;
      raise notice 'PASS: member A cannot request changes';
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'manager_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
insert into public.reviews (
  task_id, submission_id, reviewer_id, decision, feedback
)
values (
  current_setting('rls_regression.task_a_id')::uuid,
  current_setting('rls_regression.submission_a1_id')::uuid,
  current_setting('rls_regression.manager_id')::uuid,
  'changes_requested',
  'Please add one supporting detail.'
);
\echo 'PASS: manager requested changes with feedback'

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'member_a_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
insert into public.submissions (task_id, author_id, body)
values (
  current_setting('rls_regression.task_a_id')::uuid,
  current_setting('rls_regression.member_a_id')::uuid,
  'Member A version two with the requested detail.'
)
returning id as submission_a2_id \gset
select set_config(
  'rls_regression.submission_a2_id',
  :'submission_a2_id',
  true
) as _submission_a2 \gset
\echo 'PASS: member A resubmitted version two'

select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', :'manager_id', 'role', 'authenticated')::text,
  true
) as _claims \gset
insert into public.reviews (task_id, submission_id, reviewer_id, decision)
values (
  current_setting('rls_regression.task_a_id')::uuid,
  current_setting('rls_regression.submission_a2_id')::uuid,
  current_setting('rls_regression.manager_id')::uuid,
  'approved'
);
\echo 'PASS: manager approved version two'

do $$
begin
  if (
    select array_agg(version order by version)
    from public.submissions
    where task_id = current_setting('rls_regression.task_a_id')::uuid
  ) is distinct from array[1, 2] then
    raise exception 'Submission versions were not preserved.';
  end if;

  if not exists (
    select 1
    from public.reviews
    where task_id = current_setting('rls_regression.task_a_id')::uuid
      and submission_id = current_setting('rls_regression.submission_a1_id')::uuid
      and decision = 'changes_requested'
      and feedback = 'Please add one supporting detail.'
  ) or not exists (
    select 1
    from public.reviews
    where task_id = current_setting('rls_regression.task_a_id')::uuid
      and submission_id = current_setting('rls_regression.submission_a2_id')::uuid
      and decision = 'approved'
  ) then
    raise exception 'Review history or feedback was overwritten.';
  end if;

  if (
    select status
    from public.tasks
    where id = current_setting('rls_regression.task_a_id')::uuid
  ) <> 'approved' then
    raise exception 'Task A did not reach approved status.';
  end if;

  if (
    select count(*)
    from public.submissions
    where task_id in (
      current_setting('rls_regression.task_a_id')::uuid,
      current_setting('rls_regression.task_b_id')::uuid
    )
  ) <> 3 then
    raise exception 'Manager cannot read both members submissions.';
  end if;

  if not exists (
    select 1
    from storage.objects
    where name = current_setting('rls_regression.file_path')
  ) then
    raise exception 'Manager cannot read the assigned member attachment.';
  end if;

  raise notice 'PASS: both submission versions, feedback, and reviews are preserved';
  raise notice 'PASS: manager can read submissions for both assigned tasks';
  raise notice 'PASS: manager can read the assigned member attachment';
end;
$$;

rollback;
\echo 'PASS: regression test rolled back all test data'

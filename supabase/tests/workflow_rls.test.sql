-- Run with `supabase test db` after creating and promoting the four local accounts
-- documented in README.md. This test transaction rolls back its fixture tasks/data.
begin;

create extension if not exists pgtap with schema extensions;
select plan(52);

select set_config(
  'test.manager_a',
  (select id::text from public.profiles where email = 'manager-a@example.test'),
  true
);
select set_config(
  'test.manager_b',
  (select id::text from public.profiles where email = 'manager-b@example.test'),
  true
);
select set_config(
  'test.member_x',
  (select id::text from public.profiles where email = 'member-x@example.test'),
  true
);
select set_config(
  'test.member_y',
  (select id::text from public.profiles where email = 'member-y@example.test'),
  true
);
select ok(
  current_setting('test.manager_a') <> ''
  and current_setting('test.manager_b') <> ''
  and current_setting('test.member_x') <> ''
  and current_setting('test.member_y') <> '',
  'all four test profiles exist'
);

select set_config('test.task_x', gen_random_uuid()::text, true);
select set_config('test.task_y', gen_random_uuid()::text, true);
select set_config('test.task_member_manager', gen_random_uuid()::text, true);
select set_config('test.submission_1', gen_random_uuid()::text, true);
select set_config('test.submission_2', gen_random_uuid()::text, true);
select set_config('test.submission_member_manager', gen_random_uuid()::text, true);
select set_config('test.storage_name', '', true);

insert into public.tasks (id, title, instructions, due_date, manager_id, assignee_id)
values
  (
    current_setting('test.task_x')::uuid,
    'Member X task',
    'Test submission, review, and access controls.',
    current_date + 7,
    current_setting('test.manager_a')::uuid,
    current_setting('test.member_x')::uuid
  ),
  (
    current_setting('test.task_y')::uuid,
    'Member Y task',
    'Test task isolation.',
    current_date + 7,
    current_setting('test.manager_b')::uuid,
    current_setting('test.member_y')::uuid
  ),
  (
    current_setting('test.task_member_manager')::uuid,
    'Member-role task owner',
    'Verify member roles cannot review tasks.',
    current_date + 7,
    current_setting('test.member_x')::uuid,
    current_setting('test.member_y')::uuid
  );

select is(
  (
    select count(*)::integer
    from pg_constraint
    where conrelid = 'public.submissions'::regclass
      and conname = 'submissions_task_version_unique'
      and contype = 'u'
  ),
  1,
  'submission versions have a unique per-task constraint'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.manager_a'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_x'),
    gen_random_uuid(),
    current_setting('test.manager_a'),
    'approved'
  ),
  'P0001',
  'manager cannot approve a task in assigned state'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    gen_random_uuid(),
    current_setting('test.manager_a'),
    'changes_requested',
    'Must not be accepted.'
  ),
  'P0001',
  'manager cannot request changes on a task in assigned state'
);
select lives_ok(
  format(
    'insert into public.tasks(title, instructions, due_date, manager_id, assignee_id)
     values (%L, %L, current_date + 5, %L::uuid, %L::uuid)',
    'Manager-created test',
    'Should be created by manager A.',
    current_setting('test.manager_a'),
    current_setting('test.member_x')
  ),
  'manager creates a task for a member'
);
select is(
  (
    select status
    from public.tasks
    where title = 'Manager-created test'
  ),
  'assigned',
  'task status defaults to assigned'
);
select is(
  (
    select count(*)::integer
    from public.tasks
    where title = 'Manager-created test'
      and created_at is not null
      and updated_at is not null
  ),
  1,
  'task timestamps use database defaults'
);
select throws_ok(
  format(
    'insert into public.tasks(title, instructions, due_date, manager_id, assignee_id, created_at)
     values (%L, %L, current_date + 5, %L::uuid, %L::uuid, now())',
    'Client timestamp',
    'Must fail.',
    current_setting('test.manager_a'),
    current_setting('test.member_x')
  ),
  '42501',
  'manager cannot supply task timestamps'
);
select throws_ok(
  format(
    'insert into public.tasks(title, instructions, due_date, manager_id, assignee_id)
     values (%L, %L, current_date + 5, %L::uuid, %L::uuid)',
    'Member-created test',
    'Must fail.',
    current_setting('test.member_x'),
    current_setting('test.member_y')
  ),
  '42501',
  'member cannot create tasks'
);
select throws_ok(
  format(
    'insert into public.tasks(title, instructions, due_date, manager_id, assignee_id)
     values (%L, %L, current_date + 5, %L::uuid, %L::uuid)',
    'Manager-assigned test',
    'Must fail because the assignee is also a manager.',
    current_setting('test.manager_a'),
    current_setting('test.manager_b')
  ),
  '42501',
  'manager cannot assign a task to another manager'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_x'))::text,
  true
);
select lives_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.submission_1'),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Initial submission'
  ),
  'assigned member submits work'
);
select is(
  (
    select link is null and file_path is null
    from public.submissions
    where id = current_setting('test.submission_1')::uuid
  ),
  true,
  'text-only submission is accepted without a link or file'
);
select is(
  (
    select version
    from public.submissions
    where id = current_setting('test.submission_1')::uuid
  ),
  1,
  'first submission receives version 1'
);
select is(
  (
    select status
    from public.tasks
    where id = current_setting('test.task_x')::uuid
  ),
  'submitted',
  'text-only submission moves the task to submitted'
);
select is(
  (
    select created_at is not null
    from public.submissions
    where id = current_setting('test.submission_1')::uuid
  ),
  true,
  'submission timestamp uses database default'
);
select throws_ok(
  format(
    'update public.tasks set status = %L where id = %L::uuid',
    'approved',
    current_setting('test.task_x')
  ),
  '42501',
  'member cannot update task status directly'
);
select throws_ok(
  format(
    'update public.submissions set body = %L where id = %L::uuid',
    'Rewritten history',
    current_setting('test.submission_1')
  ),
  '42501',
  'submission history cannot be updated'
);
select throws_ok(
  format(
    'delete from public.submissions where id = %L::uuid',
    current_setting('test.submission_1')
  ),
  '42501',
  'submission history cannot be deleted'
);
select throws_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, version, body)
     values (%L::uuid, %L::uuid, %L::uuid, 88, %L)',
    gen_random_uuid(),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Client-supplied version'
  ),
  '42501',
  'member cannot supply a submission version'
);
select throws_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    gen_random_uuid(),
    current_setting('test.task_x'),
    current_setting('test.member_y'),
    'Wrong member submission'
  ),
  'P0001',
  'another member cannot submit on this task'
);
select throws_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    gen_random_uuid(),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Early second submission'
  ),
  'P0001',
  'submission is rejected while status is submitted'
);
select throws_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body, link)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    gen_random_uuid(),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Invalid link',
    'javascript:alert(1)'
  ),
  'P0001',
  'database rejects non-HTTP submission links'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.manager_a'))::text,
  true
);
select is(
  (
    select count(*)::integer
    from public.submissions
    where id = current_setting('test.submission_1')::uuid
  ),
  1,
  'manager can read the text-only submission'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'changes_requested'
  ),
  'P0001',
  'changes request requires feedback'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, created_at)
     values (%L::uuid, %L::uuid, %L::uuid, %L, now())',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'approved'
  ),
  '42501',
  'manager cannot supply review timestamps'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_x'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.member_x'),
    'approved',
    'Member cannot approve'
  ),
  'P0001',
  'member cannot review or approve their own submission'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.member_x'),
    'changes_requested',
    'Member cannot request changes.'
  ),
  'P0001',
  'member cannot request changes on their own submission'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.manager_b'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_b'),
    'approved',
    'Non-owner review'
  ),
  'P0001',
  'manager B cannot review manager A task'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_b'),
    'changes_requested',
    'Non-owner review'
  ),
  'P0001',
  'manager B cannot request changes on manager A task'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_y'),
    gen_random_uuid(),
    current_setting('test.manager_b'),
    'approved'
  ),
  'P0001',
  'manager cannot review a task that is not submitted'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.manager_a'))::text,
  true
);
select lives_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'changes_requested',
    'Please add the requested detail.'
  ),
  'owning manager requests changes'
);
select is(
  (
    select status
    from public.tasks
    where id = current_setting('test.task_x')::uuid
  ),
  'changes_requested',
  'review trigger sets changes_requested'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'approved'
  ),
  'P0001',
  'manager cannot approve a task in changes_requested state'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'changes_requested',
    'Must not be accepted.'
  ),
  'P0001',
  'manager cannot request changes on a task in changes_requested state'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_x'))::text,
  true
);
select lives_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.submission_2'),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Revised submission'
  ),
  'member can resubmit after changes are requested'
);
select is(
  (
    select count(*)::integer
    from public.submissions
    where task_id = current_setting('test.task_x')::uuid
  ),
  2,
  'both submission versions remain in history'
);
select is(
  (
    select version
    from public.submissions
    where id = current_setting('test.submission_2')::uuid
  ),
  2,
  'resubmission receives version 2'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.manager_a'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_1'),
    current_setting('test.manager_a'),
    'approved',
    'Stale submission'
  ),
  'P0001',
  'manager cannot review an older submission version'
);
select lives_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_2'),
    current_setting('test.manager_a'),
    'approved'
  ),
  'manager approves the latest submission'
);
select is(
  (
    select status
    from public.tasks
    where id = current_setting('test.task_x')::uuid
  ),
  'approved',
  'approved review sets terminal task status'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_2'),
    current_setting('test.manager_a'),
    'approved'
  ),
  'P0001',
  'approved task rejects another approval'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_x'),
    current_setting('test.submission_2'),
    current_setting('test.manager_a'),
    'changes_requested',
    'Must not be accepted.'
  ),
  'P0001',
  'approved task rejects a request for changes'
);
select throws_ok(
  format(
    'update public.reviews set feedback = %L where submission_id = %L::uuid',
    'Rewritten review',
    current_setting('test.submission_2')
  ),
  '42501',
  'review history cannot be updated'
);
select throws_ok(
  format(
    'delete from public.reviews where submission_id = %L::uuid',
    current_setting('test.submission_2')
  ),
  '42501',
  'review history cannot be deleted'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_x'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    gen_random_uuid(),
    current_setting('test.task_x'),
    current_setting('test.member_x'),
    'Submission after approval'
  ),
  'P0001',
  'approved task rejects further submissions'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_y'))::text,
  true
);
select is(
  (
    select count(*)::integer
    from public.tasks
    where id = current_setting('test.task_x')::uuid
  ),
  0,
  'member Y cannot read member X task'
);
select is(
  (
    select count(*)::integer
    from public.submissions
    where task_id = current_setting('test.task_x')::uuid
  ),
  0,
  'member Y cannot read member X submissions'
);
select is(
  (
    select count(*)::integer
    from public.reviews
    where task_id = current_setting('test.task_x')::uuid
  ),
  0,
  'member Y cannot read member X reviews'
);
select lives_ok(
  format(
    'insert into public.submissions(id, task_id, author_id, body)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.submission_member_manager'),
    current_setting('test.task_member_manager'),
    current_setting('test.member_y'),
    'Submitted to a member-role task owner'
  ),
  'member Y submits to the member-role task owner fixture'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_x'))::text,
  true
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision)
     values (%L::uuid, %L::uuid, %L::uuid, %L)',
    current_setting('test.task_member_manager'),
    current_setting('test.submission_member_manager'),
    current_setting('test.member_x'),
    'approved'
  ),
  'P0001',
  'a member cannot approve even as the task owner'
);
select throws_ok(
  format(
    'insert into public.reviews(task_id, submission_id, reviewer_id, decision, feedback)
     values (%L::uuid, %L::uuid, %L::uuid, %L, %L)',
    current_setting('test.task_member_manager'),
    current_setting('test.submission_member_manager'),
    current_setting('test.member_x'),
    'changes_requested',
    'Must not be accepted.'
  ),
  'P0001',
  'a member cannot request changes even as the task owner'
);

reset role;
select set_config(
  'test.storage_name',
  current_setting('test.task_x') || '/' || current_setting('test.submission_2') || '/test.txt',
  true
);
insert into storage.objects (bucket_id, name)
values ('submission-files', current_setting('test.storage_name'));

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.member_y'))::text,
  true
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'submission-files'
      and name = current_setting('test.storage_name')
  ),
  0,
  'member Y cannot read member X storage object'
);

select * from finish();
rollback;

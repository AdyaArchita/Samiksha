# Phase 2 database failure checklist

Run these checks in the Supabase SQL Editor only after:

1. Accounts exist for manager A, manager B, member X, and member Y.
2. Their UUIDs replace every `<...UUID>` placeholder below.
3. Migrations `001_schema.sql` through `004_storage.sql` have been applied in order.
4. Profiles exist and roles are set as described.

The SQL Editor is a privileged session. To test RLS as a normal user, use one of these methods:

- Call each statement through the Supabase REST API with the test user's bearer token, or
- In SQL Editor, temporarily set the JWT claim and role:

```sql
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '<test-user-uuid>',
  true
);
```

Run the setup statements as database owner before switching to `authenticated`.

## Setup

Replace placeholders and run as database owner.

```sql
insert into public.tasks (
  id, title, instructions, due_date, status, manager_id, assignee_id
) values (
  '<task-uuid>',
  'Database test task',
  'Submit and review this test task.',
  (current_date + 7),
  'assigned',
  '<manager-a-uuid>',
  '<member-x-uuid>'
);
```

## 1. Member directly updates task status

Switch to member X, then run:

```sql
update public.tasks
set status = 'approved'
where id = '<task-uuid>';
```

Expected: no row update and a permission error. The status must remain `assigned`.

## 2. Second manager reviews another manager's task

Create a submitted task:

```sql
insert into public.submissions (
  task_id, author_id, version, body, link, file_path
) values (
  '<task-uuid>',
  '<member-x-uuid>',
  1,
  'Member X initial submission',
  null,
  null
);
```

Switch to manager B and run:

```sql
insert into public.reviews (
  task_id, submission_id, reviewer_id, decision, feedback
) values (
  '<task-uuid>',
  '<submission-uuid>',
  '<manager-b-uuid>',
  'approved',
  null
);
```

Expected: RLS `42501`/permission failure. Manager B must not be able to review this task.

## 3. Review on a task that is not submitted

Keep the task at `assigned` and switch to manager A:

```sql
insert into public.reviews (
  task_id, submission_id, reviewer_id, decision, feedback
) values (
  '<task-uuid>',
  '<never-existing-submission-uuid>',
  '<manager-a-uuid>',
  'approved',
  null
);
```

Expected: custom `P0001` trigger/RLS failure because the task is not submitted and no submission exists.

## 4. Member submits on someone else's task

Switch to member Y and run:

```sql
insert into public.submissions (
  task_id, author_id, version, body, link, file_path
) values (
  '<task-uuid>',
  '<member-y-uuid>',
  1,
  'Wrong member submission',
  null,
  null
);
```

Expected: RLS `42501` or custom trigger failure. Member Y cannot submit for member X.

## 5. Second submission while status is submitted

Switch to member X and make the first submission, then run the same statement again:

```sql
insert into public.submissions (
  task_id, author_id, version, body, link, file_path
) values (
  '<task-uuid>',
  '<member-x-uuid>',
  2,
  'Second submission too early',
  null,
  null
);
```

Expected: custom `P0001` failure. The RLS policy and trigger must both reject it while status is `submitted`.

## 6. UPDATE or DELETE submissions

Switch to member X or manager A and run:

```sql
update public.submissions
set body = 'Changed history'
where task_id = '<task-uuid>';

delete from public.submissions
where task_id = '<task-uuid>';
```

Expected: permissions failure and no history change.

## 7. UPDATE or DELETE reviews

Switch to manager A and run:

```sql
update public.reviews
set feedback = 'Changed review'
where task_id = '<task-uuid>';

delete from public.reviews
where task_id = '<task-uuid>';
```

Expected: permissions failure and no review change.

## 8. Illegal approved/changes-requested transition

After the task is approved, switch to manager A and attempt:

```sql
insert into public.reviews (
  task_id, submission_id, reviewer_id, decision, feedback
) values (
  '<task-uuid>',
  '<latest-submission-uuid>',
  '<manager-a-uuid>',
  'changes_requested',
  'Not allowed after approval'
);
```

Expected: custom `P0001` failure. Approved is terminal.

# Samiksha

Samiksha is a two-role task submission and review app. Managers assign work to members; members submit a written response, with an optional file and/or link; managers approve the latest submission or request changes. Database enforcement described below is the intended design from migrations 001-004, not behavior verified against a live database.

**Live URL:** Not deployed yet — add the Vercel URL here after deployment.

**GitHub repository:** [AdyaArchita/Samiksha](https://github.com/AdyaArchita/Samiksha)

## Features and workflow

1. A manager creates a task with title, instructions, due date, and member assignee.
2. The assigned member sees the task, instructions, due date, and current status.
3. The member submits a written response, with an optional file and/or link.
4. The owning manager reviews the latest version and approves it or requests changes with feedback.
5. The member may resubmit after changes are requested; prior versions remain in history.
6. A task reaches `approved` only after a manager review.

Designed state transitions:

```text
assigned -> submitted -> approved
                     \-> changes_requested -> submitted
```

The UI labels these states Assigned, Submitted, Approved, and Changes Requested. The state-transition triggers and RLS policies are **designed behavior based on SQL**; they have not been tested against a Supabase project. See [TESTING.md](./TESTING.md); manual checks are `[ ] to verify`.

The brief says, “The member submits a written response and can attach a file or add a link” (Project - 1.pdf, p. 1). Accordingly, the written response is required; a file and a link are each optional.

## Tech stack

- Next.js App Router 16, React, TypeScript, and Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and private Storage
- Vercel deployment target; GitHub repository

## Local setup

Requirements: Node.js supported by the project dependencies, npm, and a Supabase project (hosted or local).

1. Copy `.env.example` to `.env.local`.
2. In Supabase, find the project URL and publishable key under **Project Settings → API**. Put them in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. In the Supabase SQL Editor, apply the migrations in order:
   - `supabase/migrations/001_schema.sql` — profiles, tasks, submissions, reviews, constraints, and indexes.
   - `supabase/migrations/002_helpers_and_triggers.sql` — security-definer helpers, auth profile/email triggers, version assignment, validation, and status transitions.
   - `supabase/migrations/003_rls.sql` — table grants and row-level access policies.
   - `supabase/migrations/004_storage.sql` — private submission bucket and object access policies.
4. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

   For local development, Next.js serves the app at `http://localhost:3000`.

Do not run local reset commands against a hosted project. The migrations have not been applied or verified by this project work; applying them and checking results is a manual step.

## Schema and access design

| Table/resource | Relationship | Designed access rules |
|---|---|---|
| `profiles` | One profile per `auth.users` account; role is `member` or `manager`. | Users read their own profile; managers can read member profiles for the assignee picker; members can read their assigned task's manager profile. |
| `tasks` | Each task references its manager and assigned member. | Manager and assignee can read; only a manager can insert a task they own and assign it to a member. No authenticated UPDATE/DELETE grant. |
| `submissions` | A task has versioned submissions; `(task_id, version)` is unique. | Task parties can read; the assigned member can insert while the task accepts work. No authenticated UPDATE/DELETE grant. |
| `reviews` | Each review references a matching task/submission pair; only one review per submission. | Task parties can read; only the owning manager can insert a review for the latest submission. No authenticated UPDATE/DELETE grant. |
| `storage.objects` in `submission-files` | File object path is `{task_id}/{submission_id}/{filename}`. | Assigned members can upload for open tasks; only task parties can read. The bucket is private; no app update/delete policy is defined. |

These are policy intentions from the SQL, not confirmed database results. After running the migrations, confirm in the Supabase dashboard that RLS is enabled on `storage.objects`. See [docs/PHASE2_ACCESS.md](./docs/PHASE2_ACCESS.md) and [docs/PHASE2_AUDIT.md](./docs/PHASE2_AUDIT.md).

## Authentication and roles

Public signup always creates a `member` profile. The signup form has no role selector, and the auth trigger does not trust role metadata. This prevents a caller from selecting their own manager privileges. Promote a manager using an administrator-controlled SQL operation, for example:

```sql
update public.profiles
set role = 'manager'
where email = 'manager@example.com';
```

Run the statement only for the intended account, after its profile exists. The app uses the current user's Supabase session for reads and writes; it does not use a service-role key. RLS is designed to enforce task ownership, member assignment, review permissions, and history immutability even if a client request is forged. Those controls remain unverified until the manual checks are run.

## Design decisions

- Submissions and reviews are append-only for authenticated users; the database design rejects UPDATE and DELETE.
- Triggers assign submission versions and change task status in the same transaction as accepted submissions/reviews.
- The `submission-files` bucket is private. The signed-file route validates the task/submission path, confirms the signed-in user is a task party, and matches the exact stored submission path before creating a five-minute signed URL with that user's session. Storage RLS also enforces object access when the URL is created; this behavior has not yet been observed against a real Supabase project.
- Object paths use `{task_id}/{submission_id}/{filename}` so the storage policy can bind an object to its task.
- Upload occurs before the submission row is inserted. If the upload succeeds and the database insert fails, an orphan object is possible; cleanup is a known manual limitation.
- `profiles.id` references `auth.users.id` with `ON DELETE RESTRICT`. Accounts with task/history references cannot be deleted from the dashboard until those references are deliberately handled.

## Project structure

```text
app/                    App Router pages, server actions, and signed-file route
components/             Shared UI
lib/                    Supabase clients, validation, task rules, and error mapping
supabase/migrations/    Ordered SQL schema, triggers, RLS, and storage policies
supabase/tests/         pgTAP workflow/access test
tests/unit/             Vitest tests for pure validation and workflow logic
docs/                   Earlier phase access, audit, and route notes
```

## Tests and verification

Run pure unit tests, lint, and production build with `npm test`, `npm run lint`, and `npm run build`. The pgTAP suite is in `supabase/tests/workflow_rls.test.sql`; it has **not** been run. Follow [TESTING.md](./TESTING.md) for the automated/manual coverage map and steps. No live database, storage policy, Vercel deployment, or end-to-end account flow was verified.

## Test accounts

Demo account credentials are shared privately with the reviewer and are never stored in this repository. See [DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md) for account setup without passwords.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md). No live URL is available yet.

## Future Improvements

- Chat between managers and members
- Email notifications
- Multi-manager teams
- RBAC administration

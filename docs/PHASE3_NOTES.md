# Phase 3 notes

This document records the app routes and their live database access. Manual full-loop verification was completed against migrations `001_schema.sql` through `005_fix_rls_recursion.sql` on 2026-11-23.

## Route map

| Route | Purpose | Database access |
|---|---|---|
| `/login` | Email/password sign-in | `auth.signInWithPassword`; no table write |
| `/signup` | Member signup | `auth.signUp`; `handle_new_auth_user` creates a member profile |
| `/dashboard` | Redirects to the role home | Reads own `profiles.role` |
| `/manager` | Lists owned tasks and creates tasks | `tasks_party_select`; `tasks_manager_insert`; manager member-profile read policy |
| `/manager/tasks/[id]` | Task history and review controls | `tasks_party_select`, `submissions_party_select`, `reviews_party_select`, `reviews_manager_insert` |
| `/member` | Lists only assigned tasks | `tasks_party_select` |
| `/member/tasks/[id]` | Task history and submission form | `tasks_party_select`, `submissions_party_select`, `submissions_assignee_insert` |
| `/api/files/signed` | Creates a short-lived private download URL | Storage `submission_files_party_read` |

## RLS-backed actions

- Task creation uses the authenticated Supabase session and is backed by `tasks_manager_insert`.
- Submission insertion uses `submissions_assignee_insert` and submission triggers.
- Review insertion uses `reviews_manager_insert` and review triggers.
- File upload uses `submission_files_assignee_upload`.
- Task, submission, review, and file reads are limited to task parties.
- Direct status, assignee, manager, submission history, and review history updates remain blocked at the database.

## Manual full-loop test

Set up four accounts: Manager A, Manager B, Member X, and Member Y.

- [x] Created four accounts and promoted Manager A and Manager B.
- [x] Signed in as Manager A and opened `/manager`.
- [x] Created a task for Member X with a title, instructions, assignee, and due date.
- [x] Signed in as Member X, opened `/member`, and checked the task and due date.
- [x] Submitted a written response and file/link work; file and link are optional.
- [x] Observed the `Submitted` status.
- [x] Confirmed Manager B cannot see or review Manager A's task.
- [x] Signed in as Manager A and opened `/manager/tasks/[task-id]`.
- [x] Requested changes with feedback and observed `Changes Requested`.
- [x] Signed in as Member X and checked the feedback and revised submission form.
- [x] Resubmitted with Version 1 preserved and Version 2 latest.
- [x] Signed in as Manager A and approved Version 2.
- [x] Confirmed no further submission was offered after approval.
- [x] Confirmed Member Y cannot access Member X's task or signed file URL.

The pgTAP assertions for task creation, submission versions, reviews, append-only history, and cross-member task/submission/review/storage access are in `supabase/tests/workflow_rls.test.sql`. All pgTAP checks passed.

## Database error mapping

- `42501`: designed mapping for permission denied by RLS or privileges.
- `P0001`: designed mapping that displays the database trigger message for an invalid transition/rule.
- `23505`: designed mapping for a duplicate submission/review/history row.

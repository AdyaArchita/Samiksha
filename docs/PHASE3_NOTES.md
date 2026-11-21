# Phase 3 notes

## Route map

| Route | Purpose | Database access |
|---|---|---|
| `/login` | Email/password sign-in | `auth.signInWithPassword`; no table write |
| `/signup` | Demo member/manager signup | `auth.signUp` metadata; `handle_new_auth_user` creates profile |
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

1. Sign up each account. Promote the two managers in SQL or keep role metadata for the demo.
2. Sign in as Manager A and open `/manager`.
3. Create a task for Member X with a title, instructions, assignee, and optional due date.
4. Sign in as Member X and open `/member`. Confirm the task is visible and overdue is marked if applicable.
5. Open `/member/tasks/[task-id]`, enter a written response, optionally add a link and file, and submit.
6. Confirm the status becomes `Submitted`.
7. Sign in as Manager B and confirm the task is not visible or reviewable.
8. Sign in as Manager A and open `/manager/tasks/[task-id]`.
9. Request changes with feedback. Confirm status becomes `Changes Requested`.
10. Sign in as Member X and confirm the feedback banner and revised submission form.
11. Submit a revised response. Confirm Version 1 remains visible and Version 2 becomes the latest.
12. Sign in as Manager A and approve Version 2. Confirm status becomes `Approved`.
13. Sign in as Member X and confirm the submission form is read-only.
14. Sign in as Member Y and confirm Member X's task and signed file URL are inaccessible.
15. Attempt crafted direct submissions/reviews/status updates and confirm friendly permission/state failures.

## Database error mapping

- `42501`: permission denied by RLS or privileges.
- `P0001`: invalid task transition or trigger rule.
- `23505`: duplicate submission/review/history row.

The app logs database error codes and shows friendly text rather than raw SQL errors.

## Could not verify

- No live Supabase project was connected.
- No migrations or signup flows were executed.
- RLS and storage behavior cannot be proven until 001-005 are applied and test accounts exist.
- Email confirmation and Vercel redirect behavior require live dashboard configuration.

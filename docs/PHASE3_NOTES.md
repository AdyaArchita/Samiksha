# Phase 3 notes

This document records the app routes and their intended database access. RLS, trigger, and Storage behavior is **designed from migrations 001-004**, not confirmed against a live project. Manual test items below are `[ ] to verify`.

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

- [ ] to verify: Sign up each account. New accounts are designed to start as members; promote Manager A and Manager B through the documented SQL profile update.
- [ ] to verify: Sign in as Manager A and open `/manager`.
- [ ] to verify: Create a task for Member X with a title, instructions, assignee, and required due date.
- [ ] to verify: Sign in as Member X, open `/member`, and check the task and due date.
- [ ] to verify: Open `/member/tasks/[task-id]`, enter a non-empty written response with no file or link, and submit; file and link are optional.
- [ ] to verify: Observe the intended `Submitted` status.
- [ ] to verify: Sign in as Manager B and check that the task is not visible or reviewable.
- [ ] to verify: Sign in as Manager A and open `/manager/tasks/[task-id]`.
- [ ] to verify: Request changes with feedback and observe the intended `Changes Requested` status.
- [ ] to verify: Sign in as Member X and check the feedback and revised submission form.
- [ ] to verify: Submit a revised response and check that Version 1 remains visible and Version 2 is latest.
- [ ] to verify: Sign in as Manager A and approve Version 2; observe the intended `Approved` status.
- [ ] to verify: Sign in as Member X and check that no further submission is offered.
- [ ] to verify: Sign in as Member Y and check that Member X's task and signed file URL are inaccessible.
- [ ] to verify: Attempt crafted direct submissions/reviews/status updates and record the actual friendly permission/state failures.

The pgTAP assertions for task creation, submission versions, reviews, append-only history, and cross-member task/submission/review/storage access are in `supabase/tests/workflow_rls.test.sql`. They have not been run.

## Database error mapping

- `42501`: designed mapping for permission denied by RLS or privileges.
- `P0001`: designed mapping that displays the database trigger message for an invalid transition/rule.
- `23505`: designed mapping for a duplicate submission/review/history row.

The app is designed to log database error codes and show friendly text rather than raw SQL errors; database error paths are not verified.

## Could not verify

- [ ] to verify: no migration, signup flow, RLS policy, trigger, or Storage behavior has yet been exercised against a live Supabase project.
- [ ] to verify: email confirmation and Vercel redirect behavior after configuring the project dashboard.

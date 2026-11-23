# Phase 2 static SQL audit

This audit combines static inspection of migrations `001_schema.sql` through `005_fix_rls_recursion.sql` with live verification completed on 2026-11-23.

## Findings

1. **Trigger write design.** All trigger functions that write profile/task/history rows are `SECURITY DEFINER` with `set search_path = public`. The submission trigger is designed to assign versions and update task status; the review before-trigger validates, and its after-trigger is designed to update status.
2. **Signup no longer trusts caller metadata for roles.** `handle_new_auth_user` is `SECURITY DEFINER` with `set search_path = public` and always inserts the `member` role. Its conflict update changes email/name only. Managers are promoted through an administrator SQL step.
3. **Append-only uniqueness is present.** Submissions have `UNIQUE(task_id, version)`, and reviews have `UNIQUE(submission_id)`.
4. **Storage paths match the app.** The clean storage migration accepts `{task_id}/{submission_id}/{filename}` and verifies both UUID segments.
5. **No policy recursion was found.** The `is_manager()` and `is_task_party()` helpers are security-definer functions; party SELECT policies use `is_task_party()` instead of recursive task-table subqueries. The profile manager lookup uses the task policy without that policy querying profiles for SELECT.
6. **Task status and history write restrictions.** UPDATE/DELETE are revoked for tasks, submissions, and reviews. INSERT grants are column-limited so clients cannot choose task status, submission version, or timestamps. These restrictions were exercised through the live app flow.
7. **Profile email synchronization design.** An `auth.users` email update trigger is intended to update the matching profile email.

## Verification

- [x] Migrations applied to the live Supabase project.
- [x] RLS and role isolation verified with authenticated sessions.
- [x] Version history and private Storage access verified on the live deployment.

# Phase 2 static SQL audit

This is a static inspection of the migration files only. The migrations have not been applied to a live Supabase project, so every RLS, trigger, grant, and Storage statement below describes **designed behavior based on SQL**, not confirmed runtime behavior.

## Findings

1. **Trigger write design.** All trigger functions that write profile/task/history rows are `SECURITY DEFINER` with `set search_path = public`. The submission trigger is designed to assign versions and update task status; the review before-trigger validates, and its after-trigger is designed to update status.
2. **Signup no longer trusts caller metadata for roles.** `handle_new_auth_user` is `SECURITY DEFINER` with `set search_path = public` and always inserts the `member` role. Its conflict update changes email/name only. Managers are promoted through an administrator SQL step.
3. **Append-only uniqueness is present.** Submissions have `UNIQUE(task_id, version)`, and reviews have `UNIQUE(submission_id)`.
4. **Storage paths match the app.** The clean storage migration accepts `{task_id}/{submission_id}/{filename}` and verifies both UUID segments. Since these migrations had not been applied, the correction was consolidated into `004_storage.sql` and the obsolete `005_fixes.sql` was removed.
5. **No policy recursion was found.** The `is_manager()` and `is_task_party()` helpers are security-definer functions; party SELECT policies use `is_task_party()` instead of recursive task-table subqueries. The profile manager lookup uses the task policy without that policy querying profiles for SELECT.
6. **Task status and history write restrictions.** UPDATE/DELETE are revoked for tasks, submissions, and reviews. INSERT grants are column-limited so clients cannot choose task status, submission version, or timestamps. These grants have not been exercised under an authenticated database role.
7. **Profile email synchronization design.** An `auth.users` email update trigger is intended to update the matching profile email.

## Not verified

- [ ] to verify: migration application and SQL syntax on a fresh Supabase database.
- [ ] to verify: actual RLS/grant behavior using authenticated sessions for each role.
- [ ] to verify: trigger messages, append-only guarantees, profile email sync, and private Storage policies.

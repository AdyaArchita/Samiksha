# Phase 2 static SQL audit

## Findings

1. **Status-trigger writes are safe.** `before_submission_insert`, `after_submission_insert`, and `after_review_insert` are `SECURITY DEFINER` functions with `set search_path = public`. They can update tasks or insert history despite authenticated table privileges being restricted.
2. **Signup profile trigger is safe for the documented demo.** `handle_new_auth_user` is `SECURITY DEFINER` with `set search_path = public`. It accepts only `member` or `manager`; every unrecognised value becomes `member`. It is a demo role shortcut because signup metadata is caller-controlled. Production should assign managers outside signup.
3. **Append-only uniqueness is present.** Submissions have `UNIQUE(task_id, version)`, and reviews have `UNIQUE(submission_id)`.
4. **The original storage regex did not match the app target.** Migration `005_fixes.sql` replaces it with `{task_id}/{submission_id}/{filename}` and verifies the two UUID segments.
5. **No policy recursion was found.** Profile policies use the task table and the `is_manager()` security-definer helper. Task/submission/review policies do not call back into the profile policies. The `is_manager()` helper reads `profiles` under a security-definer context, avoiding RLS recursion.
6. **Task status and history cannot be edited by authenticated users.** UPDATE/DELETE were revoked for tasks, submissions, and reviews. There are no matching UPDATE/DELETE RLS policies.

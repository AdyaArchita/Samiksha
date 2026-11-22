# Phase 2 database access design

All rows below describe the **intended behavior based on migrations 001-004**. The migrations have not been verified against a live Supabase project. Manual checks are `[ ] to verify`; do not treat the policy descriptions as observed database results.

## Policies and triggers

| Database rule | Designed to allow or block | Why |
|---|---|---|
| `is_manager()` | Returns true only when the current profile has manager role | Centralizes role checks and avoids profile/task RLS recursion. |
| `is_task_party(task_id)` | Returns true only for the task manager or assignee | Keeps task-party access checks consistent for history and storage reads. |
| Auth-user profile trigger | Creates a profile for every new auth user | Every authenticated account needs a profile and a default member role. |
| Task party SELECT policy | Each manager sees owned tasks; each member sees assigned tasks | Prevents cross-member and cross-manager task reads. |
| Task manager INSERT policy | A manager may create an `assigned` task owned by themselves and assigned to a member | Enforces role and ownership at the database boundary. |
| Task UPDATE/DELETE privileges | Authenticated users receive no UPDATE or DELETE privilege/policy | Task status and ownership cannot be edited directly by users. |
| Submission party SELECT policy | Only the task manager and assignee read submissions | Keeps submission history private to the two task parties. |
| Submission assignee INSERT policy | Only the assignee may submit while assigned or changes requested | Prevents another member and illegal state submissions. |
| Submission before trigger | Sets the next version and validates author, status, HTTP(S) links, and task/submission file path | Guarantees monotonic versions and rejects invalid work at the database boundary. |
| Submission after trigger | Changes `assigned` or `changes_requested` to `submitted` | Status and history change atomically in the same insert transaction. |
| Submission UPDATE/DELETE privileges | Authenticated users receive no UPDATE or DELETE privilege/policy | Submission history is append-only. |
| Review party SELECT policy | Only the task manager and assignee read reviews | Keeps manager feedback private to the two task parties. |
| Review manager INSERT policy | Only the owning manager may review the latest submission while submitted | Prevents member reviews and reviews by unrelated managers. |
| Review before trigger | Locks the task first; validates ownership, submitted status, latest submission, matching task, valid decision, and required feedback | Gives clear `P0001` errors before the RLS `WITH CHECK` can reject an invalid review. |
| Review after trigger | Designed to lock the task and apply the already-validated decision | Rejected or approved status changes are designed to happen atomically with the review row. |
| Review UPDATE/DELETE privileges | Authenticated users receive no UPDATE or DELETE privilege/policy | Review history is append-only. |
| Storage upload policy | Assigned member may upload only for an accepted task state and task-prefixed UUID path | Mirrors submission eligibility and keeps files private. |
| Storage read policy | Task manager or assignee may create a download URL | A member cannot read another member's file. |
| Storage UPDATE/DELETE policies | No policies are granted | Uploaded objects cannot be rewritten or deleted by the app role. |
| HTTP(S) link checks | Rejects null or HTTP(S)-like values with whitespace/other schemes | Prevents `javascript:` and malformed links in submitted data. |

## Status transition summary

- `assigned -> submitted`: designed to be created by an accepted submission insert.
- `changes_requested -> submitted`: designed to be created by a revised submission insert.
- `submitted -> approved`: designed to be created by an approved review insert.
- `submitted -> changes_requested`: designed to be created by a changes-requested review insert.
- Every other transition is designed to be rejected.

## Verification state

- [ ] to verify: apply the migrations in order to the intended Supabase project.
- [ ] to verify: run the SQL tests and manual checks in [TESTING.md](./TESTING.md).
- [ ] to verify: confirm the RLS, trigger, and private-storage behavior with real test accounts.

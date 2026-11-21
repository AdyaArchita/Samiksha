# Brief compliance checklist

**Source of truth:** `Project - 1.pdf`. Code and SQL are inspected statically. Any database-backed behavior below is **designed behavior based on migrations 001-004**, not confirmed against a live Supabase project.

| Brief item | Implementation/evidence | Status |
|---|---|---|
| 1. Manager creates task with title, instructions, due date, and assignee | `/manager`, `CreateTaskForm`, `createTaskSchema`, `tasks_manager_insert` policy | Done in app; database policy unverified |
| 2. Member sees assigned task, instructions, and due date | `/member`, `/member/tasks/[id]`, `tasks_party_select` policy | Done in app; RLS isolation unverified |
| 3. Member submits written response plus a file or link | `/member/tasks/[id]`, `SubmissionForm`, submission Zod validation; Storage upload action | Done in app; database/storage behavior unverified |
| 4. Manager reads work and approves or requests changes with feedback | Manager task detail and review action/form; `reviews_manager_insert` and review triggers | Done in app; permission/status enforcement unverified |
| 5. Member revises and resubmits; history remains visible | Submission versions/history UI and insert-only trigger design | Partial: app implemented; persistence/history not verified |
| 6. Task is Approved only after manager approval | Review trigger is designed to change status; authenticated task UPDATE is revoked | Unverified until database checks run |
| Two roles: Manager and Member | `profiles.role` constraint; signup profile trigger assigns `member`; SQL promotion procedure | Done in app/SQL design; live role setup unverified |
| Member sees only their own assigned tasks | Task party SELECT policy and member query scoped to assignee | Unverified (RLS not run) |
| Member cannot approve own submission or change review status | Manager-only review policy/trigger; no review UPDATE grant | Unverified (RLS/triggers not run) |
| Only the manager assigned to a task can review | Review policy/trigger checks task manager and current user | Unverified (RLS/triggers not run) |
| History is never overwritten | No authenticated UPDATE/DELETE grants on submissions/reviews | Unverified (database grants not run) |
| Statuses are Assigned, Submitted, Changes Requested, Approved | `StatusBadge`, `TaskStatus`, SQL constraints/triggers | Done in code; database behavior unverified |
| Useful failure and permission messages | Zod messages and `friendlyPostgresError`; unit tests | Done in code; database error paths unverified |
| Next.js, Tailwind, Supabase Auth, Postgres, RLS | App and migration files | Done in code; Supabase behavior unverified |
| Vercel | Deployment instructions prepared; no deployment made | Partial |
| GitHub repo with clear history | Repository and existing phase commits | Done |
| Credentials only in environment variables | `.env.example` has only two empty names; `.env*` ignored except example; app env references are enumerated in `TESTING.md` | Done based on static inspection |
| Live URL | No deployment/live URL exists yet | Missing |
| README setup and environment names | `README.md` | Done |
| Schema/migrations with explanation | `supabase/migrations/001-004.sql` and README table | Done (design documentation only) |
| Auth/roles explanation | README and `DEMO_ACCOUNTS.md` | Done |
| Test cases | Vitest pure tests pass; pgTAP suite exists but is not run | Partial |
| Walkthrough | Timed walkthrough script exists; no recording or live run | Partial |

## Remaining manual items

- [ ] to verify: Apply migrations to the intended Supabase project and complete the checks in [TESTING.md](./TESTING.md).
- [ ] to verify: Create the demo accounts, promote the manager, and run the full workflow.
- [ ] to verify: Deploy to Vercel, configure Supabase Auth URLs, and publish the resulting live URL.
- [ ] to verify: Record or perform the reviewer walkthrough if a recording is required by the reviewer.

No item marked Missing or Partial is silently treated as completed. Deployment and any required recording are external actions and are not performed by this change.

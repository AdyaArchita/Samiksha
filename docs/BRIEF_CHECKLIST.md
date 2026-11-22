# Brief compliance checklist

**Source of truth:** `Project - 1.pdf`. The brief says, “The member submits a written response and can attach a file or add a link” (p. 1). The written response is required; a file and/or link are optional. Database, deployment, and recording behavior below is not claimed as observed.

| Brief item | Implementation/evidence | Status |
|---|---|---|
| 1. Manager creates a task with title, instructions, due date, and member assignee | Manager form/action and task insert policy exist; database behavior has not been run. | NOT VERIFIED |
| 2. Member sees the assigned task, instructions, and due date | Member pages and task-party SELECT policy exist; RLS isolation has not been run. | NOT VERIFIED |
| 3. Member submits a written response, with an optional file and/or link | Zod requires a non-empty response and validates a link/file when provided; unit tests cover optional combinations. The database test is not run. | NOT VERIFIED |
| 4. Manager reads work and approves or requests changes with feedback | Review UI/action, RLS policy, and triggers exist; database permissions and transitions have not been run. | NOT VERIFIED |
| 5. Member revises and resubmits; history remains visible | Versioned insert/history UI and pgTAP assertions exist; persistence has not been observed. | NOT VERIFIED |
| 6. Task is Approved only after manager approval | Trigger design and revoked authenticated task updates exist; database behavior has not been run. | NOT VERIFIED |
| Two roles; members cannot approve their own work or change review status; only the assigned manager reviews | Signup and SQL role-promotion design, policies, and triggers exist; live role and permission checks have not been run. | NOT VERIFIED |
| Members see only their own assigned tasks; history is not overwritten | RLS policies and append-only grants exist; access and grant behavior have not been run. | NOT VERIFIED |
| Statuses are Assigned, Submitted, Changes Requested, Approved | App type, labels, and SQL constraint exist; trigger behavior has not been run. | NOT VERIFIED |
| Useful failure and permission messages | Zod/error mapping and unit tests exist; unit tests were run; live database error paths were not. | VERIFIED |
| Next.js, Tailwind, Supabase Auth, Postgres, and RLS | App configuration and migration files are present; hosted integration is not observed. | VERIFIED |
| Vercel deployment | Deployment instructions exist; no deployment has been made. | NOT VERIFIED |
| GitHub repository with clear history | Local history was inspected; the remote repository was not checked online. | NOT VERIFIED |
| Credentials only in environment variables | `.env.example` contains only the two blank names; `.env*` is ignored except the example; application references only the intended two names. | VERIFIED |
| Live URL | No deployment/live URL exists. | FAIL |
| README setup and environment names | Documented in `README.md`; names match `.env.example` and app references. | VERIFIED |
| Schema/migrations with explanation | Migrations 001-004 and the README migration/table descriptions are present; this verifies documentation, not database behavior. | VERIFIED |
| Auth/roles explanation | Member-only signup and SQL manager promotion are described in the README and demo-account instructions. | VERIFIED |
| Test cases | Vitest and pgTAP cases exist; the unit suite was run, but pgTAP was not. | VERIFIED |
| Recording or live walkthrough | A script exists; no recording or completed live walkthrough exists. | FAIL |

## Remaining manual checks

- [ ] to verify: Apply migrations in order, then run pgTAP and the full workflow against the intended environment.
- [ ] to verify: Confirm Storage RLS is enabled on `storage.objects` in the Supabase dashboard.
- [ ] to verify: Test the signed-file URL with a different member.
- [ ] to verify: Deploy to Vercel, configure Supabase Auth URLs, and publish the live URL.
- [ ] to verify: Record or perform the reviewer walkthrough if required.

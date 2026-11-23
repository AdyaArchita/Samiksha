# Brief compliance checklist

**Source of truth:** `Project - 1.pdf`. The brief says, “The member submits a written response and can attach a file or add a link” (p. 1). The written response is required; a file and/or link are optional. Live verification was completed on 2026-11-23.

| Brief item | Implementation/evidence | Status |
|---|---|---|
| 1. Manager creates a task with title, instructions, due date, and member assignee | Manually verified in the live workflow. | VERIFIED |
| 2. Member sees the assigned task, instructions, and due date | Manually verified in the live workflow. | VERIFIED |
| 3. Member submits a written response, with an optional file and/or link | Manually verified with written response, file, and link submissions. | VERIFIED |
| 4. Manager reads work and approves or requests changes with feedback | Manually verified in the live workflow. | VERIFIED |
| 5. Member revises and resubmits; history remains visible | Manually verified: prior versions remained visible after resubmission. | VERIFIED |
| 6. Task is Approved only after manager approval | Manually verified in the live workflow. | VERIFIED |
| Two roles; members cannot approve their own work or change review status; only the assigned manager reviews | Two roles and manager/member workflow verified manually. | VERIFIED |
| Members see only their own assigned tasks; history is not overwritten | Member isolation and history preservation verified manually. | VERIFIED |
| Statuses are Assigned, Submitted, Changes Requested, Approved | Status transitions verified manually. | VERIFIED |
| Useful failure and permission messages | Zod/error mapping and unit tests exist; unit tests were run. | VERIFIED |
| Next.js, Tailwind, Supabase Auth, Postgres, and RLS | App configuration and live Supabase integration verified. | VERIFIED |
| Vercel deployment | Live deployment verified at https://samiksha-one.vercel.app. | VERIFIED |
| GitHub repository with clear history | Local history was inspected; the remote repository was not checked online. | NOT VERIFIED |
| Credentials only in environment variables | `.env.example` contains only the two blank names; `.env*` is ignored except the example; application references only the intended two names. | VERIFIED |
| Live URL | https://samiksha-one.vercel.app | VERIFIED |
| README setup and environment names | Documented in `README.md`; names match `.env.example` and app references. | VERIFIED |
| Schema/migrations with explanation | Migrations 001-005 and the README migration/table descriptions are present; migrations were applied manually on the live project. | VERIFIED |
| Auth/roles explanation | Member-only signup and SQL manager promotion are described in the README and demo-account instructions. | VERIFIED |
| Test cases | Vitest and pgTAP cases exist; unit tests and pgTAP passed. | VERIFIED |
| Recording or live walkthrough | Manual live walkthrough completed; no recording is claimed. | VERIFIED |

## Remaining manual checks

- [x] Migrations `001`-`005` applied and the full workflow verified on the live deployment.
- [x] Private file access verified with signed URLs.
- [x] Vercel and Supabase Auth configuration verified.
- [x] pgTAP passed.

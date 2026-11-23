# Testing

## Automated coverage

| Required area | Automated test | Manual step |
|---|---|---|
| Task creation | `supabase/tests/workflow_rls.test.sql` (manager allowed; member and manager-assignee attempts rejected); Vitest task Zod validation | [x] Create tasks as the owning manager and confirm due date/assignee |
| Submission | pgTAP checks text-only insertion, assignee access, wrong member/status, generated version, and client-supplied timestamp rejection; Vitest checks text-only, optional file/link combinations, invalid links, and non-empty response validation | [x] Submit written, file, and link variations |
| Review | pgTAP checks manager/owner, non-submitted state, latest submission, and required feedback; Vitest review schema and error mapping | [x] Request changes with feedback and approve the latest submission |
| Resubmission | pgTAP checks version increment and preserved prior rows after changes requested | [x] Resubmit and confirm prior versions remain visible |
| Access restrictions | pgTAP checks task, submission, review, and storage isolation; also direct task status update and append-only history restrictions | [x] Verify manager and member isolation and private file access |

Pure tests in `tests/unit/` cover transition helpers, due-date/task/submission/review schemas, allowed file types and size, HTTP(S) links, storage path construction, and PostgreSQL error-code mapping. Run:

```bash
npm test
npm run lint
npm run build
```

The pure unit suite, lint, production build, and pgTAP suite have passed. Manual live-deployment verification was completed on 2026-11-23.

## Run pgTAP locally

Do not point these commands at a hosted project. The following steps are for a local Supabase CLI project and require Docker:

1. Start Docker and install the Supabase CLI.
2. From the repository root, start the local Supabase services:

   ```bash
   supabase start
   ```

3. Apply the local migrations and reset local data:

   ```bash
   supabase db reset
   ```

   This is a local-only reset. Do not use it against a hosted project.
4. Configure `.env.local` with the local Supabase URL and anon key; start the app with `npm run dev`. Sign up four local users using these fixture emails: `manager-a@example.test`, `manager-b@example.test`, `member-x@example.test`, and `member-y@example.test`. If email confirmation is enabled, confirm each account.
5. In the local SQL Editor, promote both manager profiles:

   ```sql
   update public.profiles
   set role = 'manager'
   where email in ('manager-a@example.test', 'manager-b@example.test');
   ```

6. From the repository root, run:

   ```bash
   supabase test db
   ```

The test transaction expects all four profiles to exist, creates task/history fixtures, asserts expected SQLSTATEs and row visibility, and rolls its fixture data back. All pgTAP checks passed on 2026-11-23.

## Manual pre-submit flow

Use one manager and two member accounts after migrations have been applied. Mark each step only after testing it against the target environment.

- [x] (1) Manager creates a task for a member with title, instructions, and due date.
- [x] (2) Member opens the task and submits a written response; confirm the task becomes Submitted and the manager can see it.
- [x] (3) Manager requests changes and enters feedback.
- [x] (4) Member submits revised work with a file and/or link; the earlier version and review remain visible.
- [x] (5) Manager approves the latest submission.
- [x] (6) A different member cannot access the task, submissions, reviews, or the first member's file URL.

## Environment and secret audit

Static inspection confirmed `.gitignore` ignores `.env*` except `.env.example`, and `.env.example` is the only tracked env-like file; it contains the two required names with empty values. The `process.env` references found are limited to:

- `proxy.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `lib/supabase/client.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `lib/supabase/server.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `lib/supabase/proxy.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Static searches found no service-role key value or database password in repository source/configuration. Supabase config role names and password-policy settings are not credentials. The local env file was not opened or copied for this audit.

## Verification complete

- [x] Unit tests passed.
- [x] Lint passed.
- [x] Production build passed.
- [x] pgTAP passed.

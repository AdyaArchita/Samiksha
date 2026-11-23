# Deployment readiness

The live deployment is https://samiksha-one.vercel.app. Supabase migrations `001_schema.sql` through `005_fix_rls_recursion.sql`, environment variables, authentication URLs, and the role-based workflow were verified manually on 2026-11-23.

1. Import the GitHub repository into Vercel and select the Next.js framework preset.
2. In Vercel **Settings → Environment Variables**, add these names with values from the Supabase project's **Project Settings → API** page for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Do not add a service-role key to Vercel for this app.
4. Before serving the app, apply migrations `001_schema.sql` through `005_fix_rls_recursion.sql` in order to the intended Supabase project using its SQL Editor.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to the Vercel production domain. Add the production domain and any intended Vercel Preview domains to Redirect URLs. This app uses request-relative routes and has no hardcoded localhost auth redirect.
6. Redeploy the Vercel project after environment variables are set.
7. Smoke test signup/sign-in, manager promotion, task assignment, submission, review, signed-file download, and sign-out using non-production test accounts. Run the full sequence in [TESTING.md](./TESTING.md).
8. Add the verified production URL to the README and [BRIEF_CHECKLIST.md](./BRIEF_CHECKLIST.md).

## Manual checks

- [x] Vercel build and environment variables verified.
- [x] Supabase Site URL and Redirect URLs configured for the Vercel domain.
- [x] Full role-based workflow and private storage access verified in the deployed environment.
- [x] Live URL published: https://samiksha-one.vercel.app.

## Pushing

Push only the `main` branch with `git push origin main`. Never use `--all` or `--mirror` from this repository.

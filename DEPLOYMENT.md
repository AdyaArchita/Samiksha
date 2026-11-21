# Deployment readiness

No deployment has been made; there is no live URL yet. These steps describe the intended Vercel/Supabase setup and are not evidence of a successful deployment.

1. Import the GitHub repository into Vercel and select the Next.js framework preset.
2. In Vercel **Settings → Environment Variables**, add these names with values from the Supabase project's **Project Settings → API** page for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Do not add a service-role key to Vercel for this app.
4. Before serving the app, apply migrations `001_schema.sql` through `004_storage.sql` in order to the intended Supabase project using its SQL Editor. Do not assume database behavior until the manual checks in [TESTING.md](./TESTING.md) are complete.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to the Vercel production domain. Add the production domain and any intended Vercel Preview domains to Redirect URLs. This app uses request-relative routes and has no hardcoded localhost auth redirect.
6. Redeploy the Vercel project after environment variables are set.
7. Smoke test signup/sign-in, manager promotion, task assignment, submission, review, signed-file download, and sign-out using non-production test accounts. Run the full sequence in [TESTING.md](./TESTING.md).
8. Add the verified production URL to the README and [BRIEF_CHECKLIST.md](./BRIEF_CHECKLIST.md).

## Manual checks

- [ ] to verify: Vercel build succeeds with the two environment variables configured.
- [ ] to verify: Supabase Site URL and Redirect URLs match the intended Vercel domain(s).
- [ ] to verify: the full role-based workflow and private storage access work in the deployed environment.
- [ ] to verify: publish the live URL for the reviewer.

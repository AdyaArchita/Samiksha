# Demo account setup

The promotion SQL below describes the intended setup after migrations have been applied; it has not been run against a live Supabase project.

Create one manager and two member accounts for the reviewer. Do not place passwords or login credentials in this repository; share them privately with the reviewer.

1. Sign up three users through `/signup` or create them in Supabase Auth.
2. Confirm each account manually if email confirmation is enabled. For a demo project only, email confirmation may instead be turned off in Supabase **Authentication → Providers → Email**.
3. After the manager profile exists, promote only that account in the SQL Editor:

   ```sql
   update public.profiles
   set role = 'manager'
   where email = 'manager@example.com';
   ```

   Replace the example email with the exact manager account email. Leave both member profiles as `member`.
4. Create tasks as the manager and assign them to either member.
5. Privately share the three account credentials with the reviewer. Never add passwords to source, documentation, commit messages, screenshots, or the GitHub repository.

Signup intentionally creates members only. Manager promotion requires an administrator-controlled SQL action because allowing role choice in public signup would permit privilege escalation.

## Verification state

- [ ] to verify: the manager account can create and review only its own tasks.
- [ ] to verify: each member sees only its own assigned tasks and history.

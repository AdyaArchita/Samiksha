# Demo account setup

Verified manually on the live deployment on 2026-11-23.

Create four demo accounts for the reviewer: `manager-a`, `manager-b`, `member-x`, and `member-y`. Do not place passwords or login credentials in this repository; share them privately with the reviewer.

1. Sign up three users through `/signup` or create them in Supabase Auth.
2. Confirm each account manually if email confirmation is enabled. For a demo project only, email confirmation may instead be turned off in Supabase **Authentication → Providers → Email**.
3. After the manager profiles exist, promote `manager-a` and `manager-b` in the SQL Editor:

   ```sql
   update public.profiles
   set role = 'manager'
   where email = 'manager@example.com';
   ```

   Replace the example email with the exact manager account email. Repeat for the second manager. Leave both member profiles as `member`.
4. Create tasks as the manager and assign them to either member.
5. Privately share the four account credentials with the reviewer. Never add passwords to source, documentation, commit messages, screenshots, or the GitHub repository.

Signup intentionally creates members only. Manager promotion requires an administrator-controlled SQL action because allowing role choice in public signup would permit privilege escalation.

## Verification state

- [x] Verified: the manager accounts can create and review only their own tasks.
- [x] Verified: each member sees only its own assigned tasks and history.

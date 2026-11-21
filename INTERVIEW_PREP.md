# Interview preparation

Database permission and trigger answers below describe the SQL design only; do not present them as verified runtime results until the manual checks are complete.

## Likely questions

1. **Why are there only two roles, and why is signup member-only?**  
   The workflow needs manager and member responsibilities. Public role selection would let a new user request manager privileges, so signup always creates a member and an administrator promotes managers.

2. **Where is authorization enforced?**  
   The UI guides each role, but the intended security boundary is Supabase RLS, grants, and trigger validation, all using the signed-in user's session. Those database controls still need live verification.

3. **How does a task move through its states?**  
   A submission insert is designed to move `assigned` or `changes_requested` to `submitted`; a review insert is designed to move `submitted` to `approved` or `changes_requested`.

4. **Why are submissions and reviews append-only?**  
   History should remain auditable. Authenticated users get no UPDATE/DELETE grant, and versions/reviews are inserted as new rows.

5. **How do you prevent a manager from reviewing another manager's task?**  
   The review policy and before-trigger both check that the reviewer is the task's owning manager and the current user.

6. **How are duplicate or stale reviews rejected?**  
   The SQL design combines one review per submission, a composite task/submission foreign key, and a trigger check that the reviewed submission is the latest.

7. **How are optional file attachments protected?**

   A file is optional. When one is supplied, the bucket is private and the path starts with task and submission IDs. The signed-file route requires a signed-in user and creates the URL with that user's session; Storage RLS is designed to enforce object access when the URL is created. This behavior has not been observed against a real project.

8. **What happens when an upload succeeds but submission insertion fails?**  
   An orphan object can remain because upload precedes the database insert. This is documented as a known limitation; operational cleanup is manual.

9. **How do you validate user input and surface failures?**  
   Server Actions parse inputs with Zod; the error mapper converts known PostgreSQL codes to friendly messages and logs the code. Database message paths need live verification.

10. **How would you investigate a failed workflow or change the requirements?**  
    Reproduce with the smallest unit or pgTAP case, inspect the relevant action/policy/trigger, make a focused change, then rerun unit tests, build, lint, and the relevant manual database check.

## Small live-change exercises

| Exercise | File(s) to edit | Suggested scope |
|---|---|---|
| Add a due-date badge for tasks due soon | `app/member/page.tsx` | Derive a display-only label from `due_date`; keep database state unchanged. |
| Add a status filter to the manager task list | `app/manager/page.tsx` and a small client filter component | Filter the already-authorized manager task list; do not broaden RLS. |
| Change the maximum review feedback length | `lib/validation.ts` and `app/manager/tasks/[id]/review-form.tsx` | Keep Zod and the UI `maxLength` in sync; update/add one focused test. |

## Where AI tools helped

Fill this in truthfully before the interview; do not claim work or validation that did not happen:

> I used **[tool(s)]** to help with **[specific tasks]**. I reviewed and changed **[specific files/decisions]** myself. I validated **[tests/build/lint/manual checks actually completed]**. I have not verified **[remaining database/deployment items]**.

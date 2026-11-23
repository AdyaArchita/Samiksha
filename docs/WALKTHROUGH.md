# Reviewer walkthrough (5-6 minutes)

This is a reviewer walkthrough verified manually on the live deployment on 2026-11-23.

## Before starting

Have the app deployed or running locally, one promoted manager, and two member accounts ready. Do not display passwords. Use a task with a due date. File and link attachments are optional.

## Script

| Time | Clicks and actions | Talking points |
|---|---|---|
| 0:00-0:35 | Open `/login`, sign in as the manager, and land on the Manager dashboard. | Signup creates members only; manager status is granted separately by an administrator. The UI role is not the security boundary. |
| 0:35-1:20 | Click **Create task**; enter title, instructions, choose a member, set the due date, then click **Create task**. Open the new task. | The task insert uses the manager's session. The intended RLS policy binds `manager_id` to the current user and permits only member assignees. The due date is required. |
| 1:20-2:05 | Sign out, sign in as the assigned member, open the task, read its instructions/date, enter a written response only, and submit. | A non-empty written response is required; a file or link is optional. Triggers are designed to assign the version and move the task to Submitted. |
| 2:05-3:00 | Sign in as the manager; open the task and review its latest submission. Enter specific feedback and click **Request Changes**. | The review UI requires feedback for this decision. The intended before-trigger validates manager ownership, task status, and latest version before the after-trigger updates status. |
| 3:00-3:45 | Sign in as the member, open the same task, read the feedback, edit the response, optionally attach a file and/or link, and resubmit. | Resubmission is designed to create a new version while retaining previous submissions and review history. |
| 3:45-4:25 | Sign in as the manager, open the latest version, and click **Approve**. | Only the latest submission is eligible for review by the task's manager. The status transition is intended to be atomic with the review insert. |
| 4:25-5:10 | Sign in as the second member and paste the first member's task URL and a file URL from the first member's submission. | The second member cannot see the task, submissions, reviews, or signed file. |
| 5:10-5:40 | Optional negative form check: on an open task, submit an empty or whitespace-only written response, with or without an optional file/link. | The app rejects an empty written response. |

## Manual verification

- [x] The create/submit/request-changes/resubmit/approve sequence completed on the live deployment.
- [x] A second member cannot access another member's task, submission history, review history, or private file.
- [x] Status changes and version history were verified.

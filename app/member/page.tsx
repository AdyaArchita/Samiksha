import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import type { Task } from "@/lib/types";

export default async function MemberPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", auth.user.id)
    .order("created_at", { ascending: false });
  const tasks = (tasksData ?? []) as Task[];

  return (
    <AppShell title="My tasks">
      {tasks.length === 0 ? (
        <p className="rounded-lg border bg-white p-6 text-sm text-zinc-600">No tasks are assigned to you.</p>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => {
            const overdue =
              task.status !== "approved"
              && task.due_date
              && task.due_date < new Date().toISOString().slice(0, 10);
            return (
              <a key={task.id} href={`/member/tasks/${task.id}`} className="rounded-lg border bg-white p-4 hover:border-zinc-400">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{task.title}</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      Due: {task.due_date ?? "No due date"}
                    </p>
                    {overdue && (
                      <p className="mt-1 text-sm font-medium text-red-700">Overdue</p>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { CreateTaskForm } from "./create-task-form";
import type { Profile, Task } from "@/lib/types";

export default async function ManagerPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .eq("manager_id", auth.user.id)
    .order("created_at", { ascending: false });
  const { data: membersData } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("role", "member")
    .order("full_name");

  const tasks = (tasksData ?? []) as Task[];
  const members = (membersData ?? []) as Profile[];

  return (
    <AppShell title="Manager dashboard">
      <CreateTaskForm members={members} />
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Tasks you created</h2>
        {tasks.length === 0 ? (
          <p className="rounded-lg border bg-white p-6 text-sm text-zinc-600">No tasks have been created yet.</p>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <a key={task.id} href={`/manager/tasks/${task.id}`} className="rounded-lg border bg-white p-4 hover:border-zinc-400">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {task.due_date ? `Due ${task.due_date}` : "No due date"}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

import { TaskDetailSkeleton } from "@/components/ui/skeletons";

export default function ManagerTaskLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <TaskDetailSkeleton />
    </main>
  );
}

import { TaskDetailSkeleton } from "@/components/ui/skeletons";

export default function MemberTaskLoading() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <TaskDetailSkeleton />
    </main>
  );
}

import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function ManagerLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <DashboardSkeleton />
      </div>
    </main>
  );
}

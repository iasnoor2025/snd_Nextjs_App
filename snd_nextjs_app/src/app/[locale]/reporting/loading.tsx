import { Skeleton } from '@/components/ui/skeleton';

export default function ReportingLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

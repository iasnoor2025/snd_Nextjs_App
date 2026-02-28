import { Skeleton } from '@/components/ui/skeleton';

export default function LocaleLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto h-3 w-32" />
      </div>
    </div>
  );
}

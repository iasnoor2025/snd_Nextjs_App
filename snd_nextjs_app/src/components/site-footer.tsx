'use client';

import { useSettings } from '@/hooks/use-settings';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function SiteFooter() {
  const { getSetting } = useSettings(['footer.copyright']);

  const copyrightText = getSetting('footer.copyright');

  // Don't render footer if no copyright text is set
  if (!copyrightText) {
    return null;
  }

  return (
    <footer className="w-full">
      <Separator className="mb-0" />
      <div className="px-4 py-1.5">
        <div className="flex items-center justify-end">
          <p 
            className={cn(
              "text-xs font-normal text-muted-foreground/80",
              "tracking-wide select-none"
            )}
          >
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

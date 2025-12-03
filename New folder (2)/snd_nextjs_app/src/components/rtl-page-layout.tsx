'use client';

import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

interface RTLPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function RTLPageLayout({ children, className }: RTLPageLayoutProps) {
  const { isRTL } = useI18n();

  return <div className={cn('space-y-6', isRTL && 'rtl', className)}>{children}</div>;
}

interface RTLHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function RTLHeader({ children, className }: RTLHeaderProps) {
  const { isRTL } = useI18n();

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        isRTL ? 'flex-row-reverse' : '',
        className
      )}
    >
      {children}
    </div>
  );
}

interface RTLContentProps {
  children: React.ReactNode;
  className?: string;
}

export function RTLContent({ children, className }: RTLContentProps) {
  const { isRTL } = useI18n();

  return <div className={cn(isRTL ? 'text-right' : 'text-left', className)}>{children}</div>;
}

interface RTLFlexProps {
  children: React.ReactNode;
  className?: string;
  gap?: string;
}

export function RTLFlex({ children, className, gap = 'gap-2' }: RTLFlexProps) {
  const { isRTL } = useI18n();

  return (
    <div className={cn('flex items-center', gap, isRTL ? 'flex-row-reverse' : '', className)}>
      {children}
    </div>
  );
}

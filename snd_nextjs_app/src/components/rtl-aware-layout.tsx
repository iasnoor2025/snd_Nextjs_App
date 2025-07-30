'use client';

import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

interface RTLAwareLayoutProps {
  children: React.ReactNode;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

export function RTLAwareLayout({ children, className, dir = 'auto' }: RTLAwareLayoutProps) {
  const { isRTL, direction } = useI18n();

  const effectiveDir = dir === 'auto' ? direction : dir;

  return (
    <div
      dir={effectiveDir}
      className={cn(
        'transition-all duration-200',
        isRTL && 'rtl',
        className
      )}
    >
      {children}
    </div>
  );
}

interface RTLAwareTextProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center' | 'justify';
}

export function RTLAwareText({ children, className, align }: RTLAwareTextProps) {
  const { isRTL } = useI18n();

  const getAlignment = () => {
    if (align) return align;
    return isRTL ? 'right' : 'left';
  };

  return (
    <div
      className={cn(
        `text-${getAlignment()}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface RTLAwareFlexProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  items?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
}

export function RTLAwareFlex({ children, className, justify, items }: RTLAwareFlexProps) {
  const { isRTL } = useI18n();

  const getJustify = () => {
    if (!justify) return isRTL ? 'justify-end' : 'justify-start';
    
    if (isRTL) {
      // Mirror justify classes for RTL
      switch (justify) {
        case 'start': return 'justify-end';
        case 'end': return 'justify-start';
        default: return `justify-${justify}`;
      }
    }
    
    return `justify-${justify}`;
  };

  return (
    <div
      className={cn(
        'flex',
        getJustify(),
        items && `items-${items}`,
        className
      )}
    >
      {children}
    </div>
  );
} 
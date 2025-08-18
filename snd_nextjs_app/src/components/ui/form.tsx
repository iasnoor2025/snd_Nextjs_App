import { cn } from '@/lib/utils';
import * as React from 'react';
import { Controller } from 'react-hook-form';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, ...props }: FormProps) {
  return <form {...props}>{children}</form>;
}

export function FormField({ name, control, render }: any) {
  return <Controller name={name} control={control} render={render} />;
}

export function FormItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

export function FormLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
    </label>
  );
}

export function FormControl({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FormMessage({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return <p className={cn('text-sm font-medium text-destructive', className)}>{children}</p>;
}

export function FormDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

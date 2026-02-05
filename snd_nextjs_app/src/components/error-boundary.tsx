'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-6 animate-slide-in">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive animate-float">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gradient">Something went wrong</h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. Don't worry, your data is safe.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted p-4 rounded-lg overflow-auto max-h-40 text-xs font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 gap-2"
                variant="default"
              >
                <RefreshCcw size={16} />
                Retry
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Home size={16} />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

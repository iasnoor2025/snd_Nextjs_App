'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface AutoGenerateResult {
  success: boolean;
  created: number;
  errors: string[];
  message: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface AutoGenerateButtonProps {
  isAutoGenerating?: boolean;
  onAutoGenerateComplete?: () => void;
}

export default function AutoGenerateButton({
  isAutoGenerating = false,
  onAutoGenerateComplete,
}: AutoGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoGenerate = useCallback(async () => {
    // Prevent multiple clicks
    if (isLoading || isAutoGenerating) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/timesheets/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: AutoGenerateResult = await response.json();

      if (result.success) {
        toast.success(result.message);
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} errors occurred during generation`);
        }

        // Show notification that table will refresh
        toast.info('Refreshing timesheets table...');

        // Notify parent component to refresh the timesheets table
        if (onAutoGenerateComplete) {
          onAutoGenerateComplete();
        }
      } else {
        toast.error('Failed to auto-generate timesheets');
        if (result.errors.length > 0) {
          result.errors.forEach(error => {
            toast.error(error);
          });
        }
      }
    } catch (error) {
      console.error('Error auto-generating timesheets:', error);
      toast.error('Failed to auto-generate timesheets');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isAutoGenerating, onAutoGenerateComplete]);

  return (
    <Button
      onClick={handleAutoGenerate}
      disabled={isLoading || isAutoGenerating}
      variant="outline"
      size="sm"
    >
      {isLoading || isAutoGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Auto-Generate Timesheets
    </Button>
  );
}

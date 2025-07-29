'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

interface AutoGenerateResult {
  success: boolean;
  created: number;
  errors: string[];
  message: string;
}

export default function AutoGenerateButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoGenerate = async () => {
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
  };

  return (
    <Button
      onClick={handleAutoGenerate}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Auto-Generate Timesheets
    </Button>
  );
}

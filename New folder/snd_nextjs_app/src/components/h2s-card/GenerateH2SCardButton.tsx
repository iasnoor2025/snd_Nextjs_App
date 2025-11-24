'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateH2SCardButtonProps {
  employeeId: number;
  trainingId: number;
  trainingName?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function GenerateH2SCardButton({
  employeeId,
  trainingId,
  trainingName,
  disabled = false,
  onSuccess,
}: GenerateH2SCardButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/employee/${employeeId}/training/${trainingId}/h2s-card-pdf`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('H2S card PDF generated and saved to employee documents');
        // Call success callback if provided, otherwise reload page
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 500);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const msg = data.error || 'Failed to generate H2S card PDF';
        const details = data.details ? `: ${data.details}` : '';
        toast.error(`${msg}${details}`);
      }
    } catch (error) {
      console.error('Error generating H2S card:', error);
      toast.error('Error generating H2S card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
      size="sm"
      variant="default"
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Generate Card
        </>
      )}
    </Button>
  );
}


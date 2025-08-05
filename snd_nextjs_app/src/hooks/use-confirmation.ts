import { useState, useCallback } from "react";

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmationState extends ConfirmationOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState | null>(null);

  const confirm = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          ...options,
          open: true,
          onConfirm: () => {
            setState(null);
            resolve(true);
          },
          onCancel: () => {
            setState(null);
            resolve(false);
          },
        });
      });
    },
    []
  );

  const close = useCallback(() => {
    setState(null);
  }, []);

  return {
    confirmation: state,
    confirm,
    close,
  };
} 
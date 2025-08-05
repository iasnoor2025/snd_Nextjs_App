"use client";

import React, { createContext, useContext } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useConfirmation } from "@/hooks/use-confirmation";

interface ConfirmationContextType {
  confirm: (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  }) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmationDialog() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmationDialog must be used within ConfirmationProvider");
  }
  return context;
}

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const { confirmation, confirm, close } = useConfirmation();

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {confirmation && (
        <ConfirmationDialog
          open={confirmation.open}
          onOpenChange={() => close()}
          title={confirmation.title}
          description={confirmation.description}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
} 
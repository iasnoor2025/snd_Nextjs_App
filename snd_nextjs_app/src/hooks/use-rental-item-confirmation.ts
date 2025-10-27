import { useState, useCallback } from 'react';

export interface RentalItemConfirmationState {
  isOpen: boolean;
  actionType: 'add' | 'edit' | 'delete' | 'confirm' | 'return';
  title: string;
  description: string;
  itemName?: string;
  onConfirm?: (returnDate?: string) => void;
  showReturnDate?: boolean;
  minReturnDate?: string;
}

export const useRentalItemConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<RentalItemConfirmationState>({
    isOpen: false,
    actionType: 'confirm',
    title: '',
    description: '',
    itemName: '',
    onConfirm: undefined,
  });

  const showConfirmation = useCallback((
    actionType: 'add' | 'edit' | 'delete' | 'confirm' | 'return',
    title: string,
    description: string,
    itemName?: string,
    onConfirm?: (returnDate?: string) => void,
    showReturnDate?: boolean,
    minReturnDate?: string
  ) => {
    setConfirmationState({
      isOpen: true,
      actionType,
      title,
      description,
      itemName,
      onConfirm,
      showReturnDate,
      minReturnDate,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback((returnDate?: string) => {
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm(returnDate);
    }
    hideConfirmation();
  }, [confirmationState.onConfirm, hideConfirmation]);

  // Convenience methods for common actions
  const showAddConfirmation = useCallback((
    description: string,
    onConfirm: () => void
  ) => {
    showConfirmation('add', 'Add Rental Item', description, undefined, onConfirm);
  }, [showConfirmation]);

  const showEditConfirmation = useCallback((
    itemName: string,
    description: string,
    onConfirm: () => void
  ) => {
    showConfirmation('edit', 'Update Rental Item', description, itemName, onConfirm);
  }, [showConfirmation]);

  const showDeleteConfirmation = useCallback((
    itemName: string,
    description: string,
    onConfirm: () => void
  ) => {
    showConfirmation('delete', 'Delete Rental Item', description, itemName, onConfirm);
  }, [showConfirmation]);

  const showReturnConfirmation = useCallback((
    itemName: string,
    description: string,
    onConfirm: (returnDate?: string) => void,
    minReturnDate?: string
  ) => {
    showConfirmation('return', 'Return Equipment', description, itemName, onConfirm, true, minReturnDate);
  }, [showConfirmation]);

  const showConfirmDialog = useCallback((
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    showConfirmation('confirm', title, description, undefined, onConfirm);
  }, [showConfirmation]);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    showAddConfirmation,
    showEditConfirmation,
    showDeleteConfirmation,
    showConfirmDialog,
    showReturnConfirmation,
  };
};

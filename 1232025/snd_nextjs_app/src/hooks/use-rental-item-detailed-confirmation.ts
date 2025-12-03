import { useState, useCallback } from 'react';
import { RentalItemData } from '@/components/rental/RentalItemDetailedConfirmationDialog';

export interface RentalItemDetailedConfirmationState {
  isOpen: boolean;
  actionType: 'add' | 'edit' | 'delete' | 'confirm';
  title: string;
  description: string;
  itemData?: RentalItemData;
  onConfirm?: () => void;
}

export const useRentalItemDetailedConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<RentalItemDetailedConfirmationState>({
    isOpen: false,
    actionType: 'confirm',
    title: '',
    description: '',
    itemData: undefined,
    onConfirm: undefined,
  });

  const showConfirmation = useCallback((
    actionType: 'add' | 'edit' | 'delete' | 'confirm',
    title: string,
    description: string,
    itemData?: RentalItemData,
    onConfirm?: () => void
  ) => {
    setConfirmationState({
      isOpen: true,
      actionType,
      title,
      description,
      itemData,
      onConfirm,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm();
    }
    hideConfirmation();
  }, [confirmationState.onConfirm, hideConfirmation]);

  // Convenience methods for common actions with item data
  const showAddConfirmation = useCallback((
    description: string,
    itemData: RentalItemData,
    onConfirm: () => void
  ) => {
    showConfirmation('add', 'Add Rental Item', description, itemData, onConfirm);
  }, [showConfirmation]);

  const showEditConfirmation = useCallback((
    description: string,
    itemData: RentalItemData,
    onConfirm: () => void
  ) => {
    showConfirmation('edit', 'Update Rental Item', description, itemData, onConfirm);
  }, [showConfirmation]);

  const showDeleteConfirmation = useCallback((
    description: string,
    itemData: RentalItemData,
    onConfirm: () => void
  ) => {
    showConfirmation('delete', 'Delete Rental Item', description, itemData, onConfirm);
  }, [showConfirmation]);

  const showConfirmDialog = useCallback((
    title: string,
    description: string,
    itemData?: RentalItemData,
    onConfirm?: () => void
  ) => {
    showConfirmation('confirm', title, description, itemData, onConfirm);
  }, [showConfirmation]);

  // Method to show confirmation for bulk actions
  const showBulkActionConfirmation = useCallback((
    actionType: 'delete' | 'confirm',
    title: string,
    description: string,
    itemCount: number,
    onConfirm: () => void
  ) => {
    const bulkItemData: RentalItemData = {
      equipmentName: `${itemCount} items`,
      unitPrice: 0,
      totalPrice: 0,
      rateType: 'bulk',
      notes: `This action will affect ${itemCount} rental items`,
    };

    showConfirmation(actionType, title, description, bulkItemData, onConfirm);
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
    showBulkActionConfirmation,
  };
};

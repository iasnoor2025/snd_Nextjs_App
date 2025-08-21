import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, Trash2, Edit, Plus } from 'lucide-react';

export interface RentalItemConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionType: 'add' | 'edit' | 'delete' | 'confirm';
  itemName?: string;
  isLoading?: boolean;
}

const RentalItemConfirmationDialog: React.FC<RentalItemConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionType,
  itemName,
  isLoading = false,
}) => {
  const getActionIcon = () => {
    switch (actionType) {
      case 'add':
        return <Plus className="h-5 w-5 text-green-600" />;
      case 'edit':
        return <Edit className="h-5 w-5 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-600" />;
      case 'confirm':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getActionButtonVariant = () => {
    switch (actionType) {
      case 'add':
      case 'confirm':
        return 'default';
      case 'edit':
        return 'default';
      case 'delete':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getActionButtonText = () => {
    switch (actionType) {
      case 'add':
        return 'Add Item';
      case 'edit':
        return 'Update Item';
      case 'delete':
        return 'Delete Item';
      case 'confirm':
        return 'Confirm';
      default:
        return 'Confirm';
    }
  };

  const getCancelButtonText = () => {
    switch (actionType) {
      case 'delete':
        return 'Keep Item';
      default:
        return 'Cancel';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getActionIcon()}
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground">
                Item: <span className="text-primary">{itemName}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {getCancelButtonText()}
          </Button>
          <Button
            variant={getActionButtonVariant()}
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              getActionButtonText()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RentalItemConfirmationDialog;

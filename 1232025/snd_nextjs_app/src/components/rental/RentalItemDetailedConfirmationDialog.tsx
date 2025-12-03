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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Trash2, 
  Edit, 
  Plus,
  Package,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

export interface RentalItemData {
  equipmentName: string;
  unitPrice: number;
  totalPrice: number;
  rateType: string;
  operatorName?: string;
  duration?: string;
  notes?: string;
}

export interface RentalItemDetailedConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionType: 'add' | 'edit' | 'delete' | 'confirm';
  itemData?: RentalItemData;
  isLoading?: boolean;
}

const RentalItemDetailedConfirmationDialog: React.FC<RentalItemDetailedConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionType,
  itemData,
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

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const getRateTypeColor = (rateType: string): string => {
    switch (rateType.toLowerCase()) {
      case 'hourly':
        return 'bg-blue-100 text-blue-800';
      case 'daily':
        return 'bg-green-100 text-green-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getActionIcon()}
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {itemData && (
          <div className="space-y-4">
            <Separator />
            
            <div className="grid grid-cols-1 gap-3">
              {/* Equipment Information */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Package className="h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{itemData.equipmentName}</p>
                  <Badge variant="outline" className={getRateTypeColor(itemData.rateType)}>
                    {itemData.rateType} Rate
                  </Badge>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unit Price:</span>
                    <span className="text-sm font-medium">SAR {formatAmount(itemData.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <span className="text-sm font-semibold text-blue-600">SAR {formatAmount(itemData.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Duration Information */}
              {itemData.duration && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="ml-2 text-sm font-medium">{itemData.duration}</span>
                  </div>
                </div>
              )}

              {/* Operator Information */}
              {itemData.operatorName && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Assigned Operator:</span>
                    <span className="ml-2 text-sm font-medium">{itemData.operatorName}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {itemData.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{itemData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

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

export default RentalItemDetailedConfirmationDialog;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  RentalItemConfirmationDialog, 
  RentalItemDetailedConfirmationDialog,
  RentalItemData 
} from './index';
import { useRentalItemConfirmation } from '@/hooks/use-rental-item-confirmation';
import { useRentalItemDetailedConfirmation } from '@/hooks/use-rental-item-detailed-confirmation';

const RentalItemConfirmationExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic confirmation hook
  const basicConfirmation = useRentalItemConfirmation();
  
  // Detailed confirmation hook
  const detailedConfirmation = useRentalItemDetailedConfirmation();

  // Sample rental item data
  const sampleItemData: RentalItemData = {
    equipmentName: 'Excavator CAT 320',
    unitPrice: 1500,
    totalPrice: 4500,
    rateType: 'daily',
    operatorName: 'Ahmed Al-Rashid',
    duration: '3 days',
    notes: 'Site preparation work for new building foundation',
  };

  const handleBasicAdd = () => {
    basicConfirmation.showAddConfirmation(
      'Are you sure you want to add this rental item?',
      () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    );
  };

  const handleDetailedAdd = () => {
    detailedConfirmation.showAddConfirmation(
      'Please review the rental item details before adding:',
      sampleItemData,
      () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    );
  };

  const handleEdit = () => {
    detailedConfirmation.showEditConfirmation(
      'Please review the updated rental item details:',
      { ...sampleItemData, unitPrice: 1600, totalPrice: 4800 },
      () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    );
  };

  const handleDelete = () => {
    detailedConfirmation.showDeleteConfirmation(
      'This action cannot be undone. Are you sure you want to delete this rental item?',
      sampleItemData,
      () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    );
  };

  const handleBulkDelete = () => {
    detailedConfirmation.showBulkActionConfirmation(
      'delete',
      'Delete Multiple Items',
      'This will permanently delete the selected rental items. This action cannot be undone.',
      5,
      () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Rental Item Confirmation Examples</CardTitle>
          <CardDescription>
            Examples of how to use the rental item confirmation dialogs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleBasicAdd} variant="outline" className="h-20">
              <div className="text-center">
                <div className="font-semibold">Basic Add</div>
                <div className="text-sm text-muted-foreground">Simple confirmation</div>
              </div>
            </Button>

            <Button onClick={handleDetailedAdd} variant="outline" className="h-20">
              <div className="text-center">
                <div className="font-semibold">Detailed Add</div>
                <div className="text-sm text-muted-foreground">With item details</div>
              </div>
            </Button>

            <Button onClick={handleEdit} variant="outline" className="h-20">
              <div className="text-center">
                <div className="font-semibold">Edit Item</div>
                <div className="text-sm text-muted-foreground">Update confirmation</div>
              </div>
            </Button>

            <Button onClick={handleDelete} variant="outline" className="h-20">
              <div className="text-center">
                <div className="font-semibold">Delete Item</div>
                <div className="text-sm text-muted-foreground">Delete confirmation</div>
              </div>
            </Button>

            <Button onClick={handleBulkDelete} variant="outline" className="h-20">
              <div className="text-center">
                <div className="font-semibold">Bulk Delete</div>
                <div className="text-sm text-muted-foreground">Multiple items</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Confirmation Dialog */}
      <RentalItemConfirmationDialog
        isOpen={basicConfirmation.confirmationState.isOpen}
        onClose={basicConfirmation.hideConfirmation}
        onConfirm={basicConfirmation.handleConfirm}
        title={basicConfirmation.confirmationState.title}
        description={basicConfirmation.confirmationState.description}
        actionType={basicConfirmation.confirmationState.actionType}
        itemName={basicConfirmation.confirmationState.itemName}
        isLoading={isLoading}
      />

      {/* Detailed Confirmation Dialog */}
      <RentalItemDetailedConfirmationDialog
        isOpen={detailedConfirmation.confirmationState.isOpen}
        onClose={detailedConfirmation.hideConfirmation}
        onConfirm={detailedConfirmation.handleConfirm}
        title={detailedConfirmation.confirmationState.title}
        description={detailedConfirmation.confirmationState.description}
        actionType={detailedConfirmation.confirmationState.actionType}
        itemData={detailedConfirmation.confirmationState.itemData}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RentalItemConfirmationExample;

# Rental Item Confirmation Dialogs

This package provides reusable confirmation dialog components for rental item management operations using shadcn UI components.

## Components

### 1. RentalItemConfirmationDialog
A basic confirmation dialog for simple confirmations without detailed item information.

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `onClose: () => void` - Function to close the dialog
- `onConfirm: () => void` - Function to execute on confirmation
- `title: string` - Dialog title
- `description: string` - Dialog description
- `actionType: 'add' | 'edit' | 'delete' | 'confirm'` - Type of action
- `itemName?: string` - Optional name of the item
- `isLoading?: boolean` - Shows loading state

### 2. RentalItemDetailedConfirmationDialog
An enhanced confirmation dialog that displays detailed rental item information.

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `onClose: () => void` - Function to close the dialog
- `onConfirm: () => void` - Function to execute on confirmation
- `title: string` - Dialog title
- `description: string` - Dialog description
- `actionType: 'add' | 'edit' | 'delete' | 'confirm'` - Type of action
- `itemData?: RentalItemData` - Detailed item information
- `isLoading?: boolean` - Shows loading state

**RentalItemData Interface:**
```typescript
interface RentalItemData {
  equipmentName: string;
  unitPrice: number;
  totalPrice: number;
  rateType: string;
  operatorName?: string;
  duration?: string;
  notes?: string;
}
```

## Hooks

### 1. useRentalItemConfirmation
Basic hook for simple confirmation dialogs.

**Methods:**
- `showAddConfirmation(description, onConfirm)`
- `showEditConfirmation(itemName, description, onConfirm)`
- `showDeleteConfirmation(itemName, description, onConfirm)`
- `showConfirmDialog(title, description, onConfirm)`

### 2. useRentalItemDetailedConfirmation
Enhanced hook for detailed confirmation dialogs with item data.

**Methods:**
- `showAddConfirmation(description, itemData, onConfirm)`
- `showEditConfirmation(description, itemData, onConfirm)`
- `showDeleteConfirmation(description, itemData, onConfirm)`
- `showConfirmDialog(title, description, itemData?, onConfirm?)`
- `showBulkActionConfirmation(actionType, title, description, itemCount, onConfirm)`

## Usage Examples

### Basic Confirmation
```tsx
import { useRentalItemConfirmation } from '@/hooks/use-rental-item-confirmation';

const MyComponent = () => {
  const confirmation = useRentalItemConfirmation();

  const handleDelete = () => {
    confirmation.showDeleteConfirmation(
      'Excavator CAT 320',
      'Are you sure you want to delete this rental item?',
      () => {
        // Delete logic here
        console.log('Item deleted');
      }
    );
  };

  return (
    <button onClick={handleDelete}>Delete Item</button>
  );
};
```

### Detailed Confirmation
```tsx
import { useRentalItemDetailedConfirmation } from '@/hooks/use-rental-item-detailed-confirmation';

const MyComponent = () => {
  const confirmation = useRentalItemDetailedConfirmation();

  const handleAdd = () => {
    const itemData = {
      equipmentName: 'Excavator CAT 320',
      unitPrice: 1500,
      totalPrice: 4500,
      rateType: 'daily',
      operatorName: 'Ahmed Al-Rashid',
      duration: '3 days',
      notes: 'Site preparation work',
    };

    confirmation.showAddConfirmation(
      'Please review the rental item details before adding:',
      itemData,
      () => {
        // Add logic here
        console.log('Item added');
      }
    );
  };

  return (
    <button onClick={handleAdd}>Add Item</button>
  );
};
```

### Using the Dialog Components Directly
```tsx
import { RentalItemDetailedConfirmationDialog } from '@/components/rental';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemData, setItemData] = useState<RentalItemData | undefined>();

  const handleConfirm = () => {
    // Confirmation logic here
    setIsOpen(false);
  };

  return (
    <RentalItemDetailedConfirmationDialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={handleConfirm}
      title="Add Rental Item"
      description="Please review the details:"
      actionType="add"
      itemData={itemData}
    />
  );
};
```

## Features

- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Built-in loading indicators
- **Action-Specific Styling**: Different button variants and colors for different actions
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **TypeScript Support**: Full type safety with interfaces
- **Customizable**: Easy to extend and modify
- **SAR Currency**: Displays amounts in Saudi Riyal format
- **Rate Type Colors**: Visual indicators for different rate types

## Styling

The components use Tailwind CSS classes and follow shadcn UI design patterns. They automatically adapt to your theme and can be customized using Tailwind classes.

## Dependencies

- React 18+
- shadcn UI components
- Lucide React icons
- Tailwind CSS
- TypeScript

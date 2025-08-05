# Delete Buttons Implementation Guide

This guide shows how to implement the shadcn/ui confirmation dialog for all delete buttons throughout your Next.js app.

## Overview

We've created a comprehensive utility system that provides pre-built confirmation dialogs for different types of deletions. This ensures consistency across your entire application.

## Quick Implementation

### 1. Import the utility
```tsx
import { useDeleteConfirmations } from "@/lib/utils/confirmation-utils";
```

### 2. Use in your component
```tsx
const { confirmDeleteEmployee, confirmDeleteEquipment, confirmDeleteRental } = useDeleteConfirmations();

const handleDelete = async (item) => {
  const confirmed = await confirmDeleteEmployee(item.name);
  if (confirmed) {
    // Your delete logic here
  }
};
```

## Implementation Examples

### Employee Management
```tsx
// Before
if (!confirm(`Are you sure you want to delete ${employee.full_name || 'this employee'}?`)) {
  return;
}

// After
const { confirmDeleteEmployee } = useDeleteConfirmations();

const handleDeleteEmployee = async (employee) => {
  const confirmed = await confirmDeleteEmployee(employee.full_name);
  if (confirmed) {
    // Delete logic
  }
};
```

### Equipment Management
```tsx
// Before
if (!confirm(`Are you sure you want to delete "${equipment.name}"?`)) {
  return;
}

// After
const { confirmDeleteEquipment } = useDeleteConfirmations();

const handleDeleteEquipment = async (equipment) => {
  const confirmed = await confirmDeleteEquipment(equipment.name);
  if (confirmed) {
    // Delete logic
  }
};
```

### Rental Management
```tsx
// Before
if (!confirm('Are you sure you want to delete this rental?')) return;

// After
const { confirmDeleteRental } = useDeleteConfirmations();

const handleDeleteRental = async (rental) => {
  const confirmed = await confirmDeleteRental();
  if (confirmed) {
    // Delete logic
  }
};
```

## Available Confirmation Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `confirmDeleteAdvance` | Delete advance payments | None |
| `confirmDeleteEmployee` | Delete employees | `employeeName?: string` |
| `confirmDeleteEquipment` | Delete equipment | `equipmentName?: string` |
| `confirmDeleteRental` | Delete rentals | None |
| `confirmDeleteProject` | Delete projects | `projectName?: string` |
| `confirmDeleteTimesheet` | Delete timesheets | None |
| `confirmDeleteLeave` | Delete leave requests | None |
| `confirmDeleteUser` | Delete users | `userName?: string` |
| `confirmDeleteRole` | Delete roles | `roleName?: string` |
| `confirmDeleteCompany` | Delete companies | `companyName?: string` |
| `confirmDeleteCustomer` | Delete customers | `customerName?: string` |
| `confirmDeleteLocation` | Delete locations | `locationName?: string` |
| `confirmDeleteDocument` | Delete documents | None |
| `confirmDeletePayment` | Delete payments | None |
| `confirmDeleteAssignment` | Delete assignments | None |
| `confirmDeleteTemplate` | Delete templates | `templateName?: string` |
| `confirmDeleteResource` | Delete resources | `resourceType?: string` |
| `confirmDeleteReport` | Delete reports | None |
| `confirmDeleteSetting` | Delete settings | None |
| `confirmDeleteQuotation` | Delete quotations | None |
| `confirmDeleteInvoice` | Delete invoices | None |
| `confirmDeleteSafetyRecord` | Delete safety records | None |
| `confirmDeleteAnalyticsReport` | Delete analytics reports | None |
| `confirmBulkDelete` | Bulk delete items | `count: number, itemType: string` |
| `confirmCancel` | Cancel operations | `itemType: string` |
| `confirmApprove` | Approve items | `itemType: string` |
| `confirmReject` | Reject items | `itemType: string` |

## Files to Update

Here are the files that need to be updated to use the confirmation dialog:

### High Priority (Core Functionality)
1. `src/app/modules/employee-management/page.tsx` ✅ (Updated)
2. `src/app/modules/employee-management/[id]/page.tsx` ✅ (Updated)
3. `src/app/modules/equipment-management/[id]/page.tsx` ✅ (Updated)
4. `src/app/modules/rental-management/page.tsx` ✅ (Updated)
5. `src/app/modules/rental-management/[id]/page.tsx`
6. `src/app/modules/project-management/page.tsx`
7. `src/app/modules/project-management/[id]/page.tsx`
8. `src/app/modules/user-management/page.tsx`
9. `src/app/modules/customer-management/page.tsx`
10. `src/app/modules/company-management/page.tsx`

### Medium Priority (Supporting Features)
11. `src/app/modules/timesheet-management/page.tsx`
12. `src/app/modules/leave-management/page.tsx`
13. `src/app/modules/leave-management/[id]/page.tsx`
14. `src/app/modules/location-management/page.tsx`
15. `src/app/modules/settings/page.tsx`
16. `src/app/modules/analytics/page.tsx`
17. `src/app/modules/reporting/page.tsx`
18. `src/app/modules/safety-management/page.tsx`
19. `src/app/modules/quotation-management/page.tsx`
20. `src/app/modules/rental-management/invoices/page.tsx`

### Components
21. `src/components/employee/DocumentsTab.tsx`
22. `src/components/employee/AssignmentsTab.tsx`
23. `src/components/employee/PaymentHistory.tsx`
24. `src/components/equipment/EquipmentRentalHistory.tsx`
25. `src/components/project/ResourceManagement.tsx`

## Implementation Pattern

For each file, follow this pattern:

### 1. Import the utility
```tsx
import { useDeleteConfirmations } from "@/lib/utils/confirmation-utils";
```

### 2. Add to component
```tsx
const { confirmDelete[ItemType] } = useDeleteConfirmations();
```

### 3. Replace confirm() calls
```tsx
// Before
if (!confirm('Are you sure you want to delete this item?')) return;

// After
const confirmed = await confirmDelete[ItemType]();
if (confirmed) {
  // Your delete logic
}
```

## Example: Complete Implementation

```tsx
"use client";

import { useState } from "react";
import { useDeleteConfirmations } from "@/lib/utils/confirmation-utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MyComponent() {
  const { confirmDeleteEmployee } = useDeleteConfirmations();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteEmployee = async (employee) => {
    const confirmed = await confirmDeleteEmployee(employee.name);
    
    if (confirmed) {
      setDeleting(true);
      try {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Employee deleted successfully');
          // Refresh data
        } else {
          toast.error('Failed to delete employee');
        }
      } catch (error) {
        toast.error('Failed to delete employee');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <Button 
      onClick={() => handleDeleteEmployee(employee)}
      variant="destructive"
      disabled={deleting}
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

## Benefits

1. **Consistent UX**: All delete confirmations look and behave the same
2. **Better Accessibility**: Proper ARIA attributes and keyboard navigation
3. **Customizable**: Different variants for different types of actions
4. **Type Safety**: Full TypeScript support
5. **Maintainable**: Centralized confirmation logic
6. **Professional**: Modern, polished UI instead of browser alerts

## Migration Checklist

- [ ] Import `useDeleteConfirmations` in each file
- [ ] Replace `confirm()` calls with appropriate confirmation functions
- [ ] Update async/await patterns
- [ ] Test all delete operations
- [ ] Verify error handling
- [ ] Check loading states
- [ ] Test accessibility

## Testing

After implementation, test:
1. Delete operations work correctly
2. Confirmation dialogs appear
3. Cancel button works
4. Confirm button works
5. Loading states display properly
6. Error messages show correctly
7. Success messages show correctly

This implementation provides a consistent, professional, and accessible way to handle all delete operations throughout your application. 
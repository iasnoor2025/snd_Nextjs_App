# Confirmation Dialog Guide

This guide explains how to use the shadcn/ui confirmation dialog throughout your Next.js app.

## Overview

The confirmation dialog system consists of:
- `ConfirmationDialog` component (already exists)
- `useConfirmation` hook for state management
- `ConfirmationProvider` for global access
- `useConfirmationDialog` hook for easy usage

## Setup

The confirmation dialog is already integrated into your app through the `Providers` component. No additional setup is required.

## Usage

### Basic Usage

```tsx
import { useConfirmationDialog } from "@/components/providers/confirmation-provider";

function MyComponent() {
  const { confirm } = useConfirmationDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Item",
      description: "Are you sure you want to delete this item?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });

    if (confirmed) {
      // Proceed with deletion
      await deleteItem();
    }
  };

  return (
    <Button onClick={handleDelete} variant="destructive">
      Delete Item
    </Button>
  );
}
```

### Available Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `title` | string | ✅ | - | Dialog title |
| `description` | string | ✅ | - | Dialog description |
| `confirmText` | string | ❌ | "Confirm" | Confirm button text |
| `cancelText` | string | ❌ | "Cancel" | Cancel button text |
| `variant` | "default" \| "destructive" | ❌ | "default" | Button styling variant |

### Common Patterns

#### 1. Delete Confirmation
```tsx
const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item",
    description: "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "destructive"
  });

  if (confirmed) {
    await deleteItem();
  }
};
```

#### 2. Archive Confirmation
```tsx
const handleArchive = async () => {
  const confirmed = await confirm({
    title: "Archive Document",
    description: "This document will be moved to the archive. You can restore it later if needed.",
    confirmText: "Archive",
    cancelText: "Keep Active"
  });

  if (confirmed) {
    await archiveDocument();
  }
};
```

#### 3. User Removal
```tsx
const handleRemoveUser = async () => {
  const confirmed = await confirm({
    title: "Remove User",
    description: "This user will lose access to the system immediately. They can be re-added later if needed.",
    confirmText: "Remove User",
    cancelText: "Keep User",
    variant: "destructive"
  });

  if (confirmed) {
    await removeUser();
  }
};
```

#### 4. Settings Change
```tsx
const handleUpdateSettings = async () => {
  const confirmed = await confirm({
    title: "Update Settings",
    description: "This will change system-wide settings that may affect all users. Are you sure?",
    confirmText: "Update Settings",
    cancelText: "Cancel"
  });

  if (confirmed) {
    await updateSettings();
  }
};
```

#### 5. Data Export
```tsx
const handleExport = async () => {
  const confirmed = await confirm({
    title: "Export Data",
    description: "This will export all data to a CSV file. The process may take a few minutes.",
    confirmText: "Export",
    cancelText: "Cancel"
  });

  if (confirmed) {
    await exportData();
  }
};
```

## Integration Examples

### In Employee Management

```tsx
// In employee management page
const handleDeleteEmployee = async () => {
  const confirmed = await confirm({
    title: "Delete Employee",
    description: "Are you sure you want to delete this employee? This will remove all associated data.",
    confirmText: "Delete Employee",
    cancelText: "Cancel",
    variant: "destructive"
  });

  if (confirmed) {
    await deleteEmployee(employeeId);
  }
};
```

### In Equipment Management

```tsx
// In equipment management
const handleDeleteEquipment = async () => {
  const confirmed = await confirm({
    title: "Delete Equipment",
    description: "This equipment will be permanently removed from the system. All rental history will be lost.",
    confirmText: "Delete Equipment",
    cancelText: "Cancel",
    variant: "destructive"
  });

  if (confirmed) {
    await deleteEquipment(equipmentId);
  }
};
```

### In Timesheet Management

```tsx
// In timesheet management
const handleDeleteTimesheet = async () => {
  const confirmed = await confirm({
    title: "Delete Timesheet",
    description: "This timesheet entry will be permanently deleted. This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "destructive"
  });

  if (confirmed) {
    await deleteTimesheet(timesheetId);
  }
};
```

## Best Practices

1. **Use descriptive titles**: Make the title clear about what action will be performed
2. **Provide clear descriptions**: Explain what will happen and any consequences
3. **Use appropriate variants**: Use "destructive" for dangerous actions, "default" for normal actions
4. **Customize button text**: Make button text specific to the action
5. **Handle async operations**: Always await the confirmation before proceeding
6. **Provide feedback**: Show success/error messages after the action

## Testing

You can test the confirmation dialog by visiting `/test-confirmation` in your app. This page shows various examples of how to use the confirmation dialog.

## Migration from Native Confirm

If you're migrating from the native `confirm()` function:

**Before:**
```tsx
if (confirm('Are you sure you want to delete this item?')) {
  deleteItem();
}
```

**After:**
```tsx
const { confirm } = useConfirmationDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item",
    description: "Are you sure you want to delete this item?",
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "destructive"
  });

  if (confirmed) {
    deleteItem();
  }
};
```

## Troubleshooting

### Dialog not showing
- Make sure the component is wrapped in `ConfirmationProvider`
- Check that you're using the hook correctly
- Verify the component is client-side (`"use client"`)

### TypeScript errors
- Ensure you're importing from the correct path
- Check that all required options are provided
- Verify the variant type is correct

### Styling issues
- The dialog uses shadcn/ui components, so ensure your theme is properly configured
- Check that Tailwind CSS is working correctly

## Files Structure

```
src/
├── components/
│   ├── ui/
│   │   └── confirmation-dialog.tsx    # Main dialog component
│   ├── providers/
│   │   └── confirmation-provider.tsx  # Global provider
│   └── examples/
│       └── confirmation-examples.tsx  # Usage examples
├── hooks/
│   └── use-confirmation.ts            # State management hook
└── app/
    └── test-confirmation/
        └── page.tsx                   # Test page
```

This confirmation dialog system provides a consistent, accessible, and user-friendly way to confirm actions throughout your application. 
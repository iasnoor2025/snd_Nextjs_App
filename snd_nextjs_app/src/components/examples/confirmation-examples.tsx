"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConfirmationDialog } from "@/components/providers/confirmation-provider";
import { toast } from "sonner";
import {
  Trash2,
  Edit,
  Archive,
  Download,
  Share,
  UserX,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

export function ConfirmationExamples() {
  const { confirm } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  // Example 1: Simple confirmation
  const handleSimpleConfirm = async () => {
    const confirmed = await confirm({
      title: "Confirm Action",
      description: "Are you sure you want to proceed with this action?",
      confirmText: "Yes, proceed",
      cancelText: "Cancel",
    });

    if (confirmed) {
      toast.success("Action confirmed!");
    }
  };

  // Example 2: Destructive confirmation
  const handleDeleteConfirm = async () => {
    const confirmed = await confirm({
      title: "Delete Item",
      description: "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        toast.success("Item deleted successfully!");
        setLoading(false);
      }, 1000);
    }
  };

  // Example 3: Archive confirmation
  const handleArchiveConfirm = async () => {
    const confirmed = await confirm({
      title: "Archive Document",
      description: "This document will be moved to the archive. You can restore it later if needed.",
      confirmText: "Archive",
      cancelText: "Keep Active",
    });

    if (confirmed) {
      toast.success("Document archived!");
    }
  };

  // Example 4: User removal confirmation
  const handleRemoveUserConfirm = async () => {
    const confirmed = await confirm({
      title: "Remove User",
      description: "This user will lose access to the system immediately. They can be re-added later if needed.",
      confirmText: "Remove User",
      cancelText: "Keep User",
      variant: "destructive",
    });

    if (confirmed) {
      toast.success("User removed from system!");
    }
  };

  // Example 5: Settings change confirmation
  const handleSettingsConfirm = async () => {
    const confirmed = await confirm({
      title: "Update Settings",
      description: "This will change system-wide settings that may affect all users. Are you sure?",
      confirmText: "Update Settings",
      cancelText: "Cancel",
    });

    if (confirmed) {
      toast.success("Settings updated successfully!");
    }
  };

  // Example 6: Data export confirmation
  const handleExportConfirm = async () => {
    const confirmed = await confirm({
      title: "Export Data",
      description: "This will export all data to a CSV file. The process may take a few minutes.",
      confirmText: "Export",
      cancelText: "Cancel",
    });

    if (confirmed) {
      toast.success("Data export started!");
    }
  };

  // Example 7: Share confirmation
  const handleShareConfirm = async () => {
    const confirmed = await confirm({
      title: "Share Document",
      description: "This document will be shared with the selected users. They will receive an email notification.",
      confirmText: "Share",
      cancelText: "Cancel",
    });

    if (confirmed) {
      toast.success("Document shared successfully!");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Confirmation Dialog Examples</h1>
        <p className="text-muted-foreground mt-2">
          Examples of how to use the confirmation dialog throughout your app
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Simple Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Simple Confirmation
            </CardTitle>
            <CardDescription>
              Basic confirmation dialog with default styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSimpleConfirm} className="w-full">
              Confirm Action
            </Button>
          </CardContent>
        </Card>

        {/* Destructive Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Destructive Action
            </CardTitle>
            <CardDescription>
              Confirmation for dangerous actions with destructive styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDeleteConfirm} 
              variant="destructive" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Item"}
            </Button>
          </CardContent>
        </Card>

        {/* Archive Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-600" />
              Archive Action
            </CardTitle>
            <CardDescription>
              Confirmation for archiving items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleArchiveConfirm} variant="outline" className="w-full">
              Archive Document
            </Button>
          </CardContent>
        </Card>

        {/* User Removal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Remove User
            </CardTitle>
            <CardDescription>
              Confirmation for removing user access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRemoveUserConfirm} 
              variant="destructive" 
              className="w-full"
            >
              Remove User
            </Button>
          </CardContent>
        </Card>

        {/* Settings Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Settings Change
            </CardTitle>
            <CardDescription>
              Confirmation for system-wide changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSettingsConfirm} variant="outline" className="w-full">
              Update Settings
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Data Export
            </CardTitle>
            <CardDescription>
              Confirmation for data export operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportConfirm} className="w-full">
              Export Data
            </Button>
          </CardContent>
        </Card>

        {/* Share Document */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Share Document
            </CardTitle>
            <CardDescription>
              Confirmation for sharing documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleShareConfirm} variant="outline" className="w-full">
              Share Document
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Import the hook</h3>
            <pre className="bg-muted p-3 rounded text-sm">
              {`import { useConfirmationDialog } from "@/components/providers/confirmation-provider";`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Use in your component</h3>
            <pre className="bg-muted p-3 rounded text-sm">
              {`const { confirm } = useConfirmationDialog();

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
  }
};`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Available Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Required:</h4>
                <ul className="text-sm space-y-1">
                  <li><code>title</code> - Dialog title</li>
                  <li><code>description</code> - Dialog description</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Optional:</h4>
                <ul className="text-sm space-y-1">
                  <li><code>confirmText</code> - Confirm button text (default: "Confirm")</li>
                  <li><code>cancelText</code> - Cancel button text (default: "Cancel")</li>
                  <li><code>variant</code> - "default" or "destructive"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
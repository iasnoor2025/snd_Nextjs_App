'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/services/notification-service';
import { useNotificationContext } from '@/contexts/notification-context';

export const NotificationDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();

  const handleSuccessNotification = () => {
    notify.success('Success!', 'This is a success notification with an action button.', '/modules/employee-management');
  };

  const handleErrorNotification = () => {
    notify.error('Error!', 'This is an error notification that requires attention.');
  };

  const handleWarningNotification = () => {
    notify.warning('Warning!', 'This is a warning notification about something important.');
  };

  const handleInfoNotification = () => {
    notify.info('Information', 'This is an informational notification.');
  };

  const handleEmployeeCreated = () => {
    notify.employeeCreated('John Doe');
  };

  const handleTimesheetSubmitted = () => {
    notify.timesheetSubmitted();
  };

  const handleEquipmentAssigned = () => {
    notify.equipmentAssigned('Excavator XC-2000');
  };

  const handlePayrollGenerated = () => {
    notify.payrollGenerated('December 2024');
  };

  const handleContextSuccess = () => {
    showSuccess('Context Success', 'This notification was triggered using the context hook.');
  };

  const handleContextError = () => {
    showError('Context Error', 'This error notification was triggered using the context hook.');
  };

  const handlePromiseNotification = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve('Success!');
        } else {
          reject('Failed!');
        }
      }, 2000);
    });

    notify.promise(promise, {
      loading: 'Processing your request...',
      success: 'Request completed successfully!',
      error: 'Request failed. Please try again.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Service Demo</CardTitle>
          <CardDescription>
            Test different types of notifications using the notification service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleSuccessNotification} variant="default">
              Success Notification
            </Button>
            <Button onClick={handleErrorNotification} variant="destructive">
              Error Notification
            </Button>
            <Button onClick={handleWarningNotification} variant="outline">
              Warning Notification
            </Button>
            <Button onClick={handleInfoNotification} variant="secondary">
              Info Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Logic Notifications</CardTitle>
          <CardDescription>
            Pre-configured notifications for common business operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleEmployeeCreated} variant="outline">
              Employee Created
            </Button>
            <Button onClick={handleTimesheetSubmitted} variant="outline">
              Timesheet Submitted
            </Button>
            <Button onClick={handleEquipmentAssigned} variant="outline">
              Equipment Assigned
            </Button>
            <Button onClick={handlePayrollGenerated} variant="outline">
              Payroll Generated
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Context Hook Notifications</CardTitle>
          <CardDescription>
            Notifications triggered using the notification context hook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleContextSuccess} variant="outline">
              Context Success
            </Button>
            <Button onClick={handleContextError} variant="outline">
              Context Error
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promise-based Notifications</CardTitle>
          <CardDescription>
            Show loading, success, and error states for async operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePromiseNotification} variant="outline" className="w-full">
            Test Promise Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600">
                Manage system notifications
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Notification
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  This module is under development. Coming soon with comprehensive notification management features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications Module</h3>
              <p className="text-gray-600 mb-6">
                This module will include notification preferences, email notifications, SMS alerts, and notification history.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Notification preferences management</p>
                <p>• Email and SMS notifications</p>
                <p>• Push notifications</p>
                <p>• Notification templates</p>
                <p>• Notification history and analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

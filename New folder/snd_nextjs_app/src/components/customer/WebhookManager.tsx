'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface WebhookStatus {
  isActive: boolean;
  webhookUrl: string;
  setupInstructions: string[];
}

export function WebhookManager() {
  const { t: _t } = useTranslation('customer');
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    loadWebhookInfo();
  }, []);

  const loadWebhookInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/erpnext/setup?action=get_webhook_info');
      const result = await response.json();

      if (result.success) {
        setWebhookStatus({
          isActive: true,
          webhookUrl: result.data.webhookUrl,
          setupInstructions: result.data.setupInstructions,
        });
      }
    } catch (error) {
      console.error('Failed to load webhook info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebhook = async () => {
    setIsSettingUp(true);
    try {
      const response = await fetch('/api/webhooks/erpnext/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setup_customer_webhook',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Customer webhook setup successfully!');
        setWebhookStatus({
          isActive: true,
          webhookUrl: result.data.webhookUrl,
          setupInstructions: result.data.setupInstructions,
        });
      } else {
        toast.error(result.message || 'Failed to setup webhook');
      }
    } catch (_error) {
      toast.error('Failed to setup webhook');
    } finally {
      setIsSettingUp(false);
    }
  };

  const copyWebhookUrl = () => {
    if (webhookStatus?.webhookUrl) {
      navigator.clipboard.writeText(webhookStatus.webhookUrl);
      toast.success('Webhook URL copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Webhook Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ERPNext Webhook Management
          {webhookStatus?.isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage real-time synchronization with ERPNext through webhooks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhookStatus ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Webhook URL:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyWebhookUrl}
                  className="h-6 px-2"
                >
                  Copy
                </Button>
              </div>
              <div className="p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {webhookStatus.webhookUrl}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {webhookStatus.isActive ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={setupWebhook} disabled={isSettingUp} size="sm">
                {isSettingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Reconfigure Webhook
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
            <div>
              <p className="text-sm text-gray-600 mb-4">
                No webhook is currently configured. Set up a webhook to enable real-time synchronization.
              </p>
              <Button onClick={setupWebhook} disabled={isSettingUp}>
                {isSettingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Setup Customer Webhook
              </Button>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Setup Instructions:</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {webhookStatus?.setupInstructions?.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-mono">{index + 1}.</span>
                <span>{instruction}</span>
              </div>
            )) || (
              <div className="text-sm text-gray-500">
                1. In ERPNext, go to Setup {'>'} Integrations {'>'} Webhooks<br />
                2. Create a new webhook for Customer doctype<br />
                3. Set the webhook URL to your application endpoint<br />
                4. Configure events: after_insert, after_update, after_delete
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">How it works:</p>
              <ul className="mt-1 space-y-1">
                <li>• When a customer is created/updated/deleted in ERPNext, a webhook is triggered</li>
                <li>• The webhook sends the customer data to your application</li>
                <li>• Your application automatically syncs the changes to the local database</li>
                <li>• Real-time notifications are sent to connected users</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

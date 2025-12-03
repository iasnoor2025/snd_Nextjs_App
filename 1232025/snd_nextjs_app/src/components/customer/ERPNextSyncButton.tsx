'use client';

import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ERPNextSyncButtonProps {
  onSyncComplete?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ERPNextSyncButton({ 
  onSyncComplete, 
  variant = 'outline', 
  size = 'default',
  className = ''
}: ERPNextSyncButtonProps) {
  const { t } = useTranslation('customer');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setHasUpdates(false); // Reset update indicator
    
    try {
      const response = await fetch('/api/customers/sync/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('messages.syncSuccess', { count: result.data.processed }));
        onSyncComplete?.();
      } else {
        toast.error(result.message || t('messages.syncError'));
      }
    } catch {
      toast.error(t('messages.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen for customer updates from ERPNext webhooks
  useEffect(() => {
    const handleCustomerUpdate = (event: CustomEvent) => {
      const { eventType, customerName, action } = event.detail;
      
      // Show notification about the change
      toast.info(`Customer "${customerName}" was ${action} in ERPNext`);
      
      // Set update indicator
      setHasUpdates(true);
      
      // Auto-sync if it's a significant change
      if (eventType === 'create' || eventType === 'update') {
        toast.info('Auto-syncing customer data from ERPNext...');
        handleSync();
      }
    };

    // Listen for custom events
    window.addEventListener('customer-updated', handleCustomerUpdate as EventListener);

    return () => {
      window.removeEventListener('customer-updated', handleCustomerUpdate as EventListener);
    };
  }, []);

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant={variant}
      size={size}
      className={className}
    >
      {isSyncing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : hasUpdates ? (
        <Bell className="h-4 w-4 mr-2 text-orange-500" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {isSyncing 
        ? t('actions.syncing') 
        : hasUpdates 
          ? `${t('actions.syncFromERPNext')} (Updates Available)`
          : t('actions.syncFromERPNext')
      }
    </Button>
  );
}

'use client';

import React from 'react';
import { useSSEContext } from '@/contexts/sse-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface SSEStatusProps {
  showDetails?: boolean;
  showControls?: boolean;
  className?: string;
}

export function SSEStatus({ 
  showDetails = false, 
  showControls = true,
  className = '' 
}: SSEStatusProps) {
  const { 
    isConnected, 
    isConnecting, 
    error, 
    lastEvent, 
    events,
    connect, 
    disconnect, 
    reconnect,
    clearEvents 
  } = useSSEContext();

  const getStatusIcon = () => {
    if (isConnecting) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isConnected) return <Wifi className="h-4 w-4 text-green-500" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (isConnected) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleReconnect = () => {
    reconnect();
    toast.info('Reconnecting to real-time updates...');
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Disconnected from real-time updates');
  };

  const handleClearEvents = () => {
    clearEvents();
    toast.success('Event history cleared');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Real-time Status</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showControls && (
          <div className="flex gap-2">
            {!isConnected && !isConnecting && (
              <Button 
                size="sm" 
                onClick={connect}
                className="flex items-center gap-1"
              >
                <Wifi className="h-4 w-4" />
                Connect
              </Button>
            )}
            
            {isConnected && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Disconnect
              </Button>
            )}
            
            {!isConnecting && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleReconnect}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </Button>
            )}
            
            {events.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleClearEvents}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Events
              </Button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {showDetails && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Events received:</span>
              <Badge variant="secondary">{events.length}</Badge>
            </div>
            
            {lastEvent && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last event:</span>
                </div>
                <div className="p-2 bg-muted rounded-md text-xs">
                  <div className="font-medium">{lastEvent.type}</div>
                  <div className="text-muted-foreground">
                    {new Date(lastEvent.timestamp).toLocaleString()}
                  </div>
                  <div className="mt-1">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(lastEvent.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Recent events:</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {events.slice(0, 5).map((event, index) => (
                    <div 
                      key={`${event.id}-${index}`}
                      className="p-2 bg-muted rounded-md text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.type}</span>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for header/toolbar
export function SSEStatusCompact() {
  const { isConnected, isConnecting, error } = useSSEContext();

  const getStatusIcon = () => {
    if (isConnecting) return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
    if (isConnected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {isConnecting ? 'Connecting' : isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
} 
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
    connectionStatus,
    reconnect
  } = useSSEContext();

  const isConnecting = connectionStatus === 'connecting';
  const error = connectionStatus === 'error';

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
    if (eventSource) {
      eventSource.close();
    }
    connect();
  };

  // Note: disconnect and clearEvents methods are not available in the current SSE context
  const handleDisconnect = () => {
    toast.info('Disconnect functionality not implemented');
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
                onClick={() => toast.info('Connect functionality not implemented')}
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
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">Connection error</span>
          </div>
        )}

        {showDetails && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection status:</span>
              <Badge variant="secondary">{connectionStatus}</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
              </div>
              <div className="p-2 bg-muted rounded-md text-xs">
                <div className="font-medium">Real-time updates</div>
                <div className="text-muted-foreground">
                  {isConnected ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for header/toolbar
export function SSEStatusCompact() {
  const { isConnected, connectionStatus } = useSSEContext();
  const isConnecting = connectionStatus === 'connecting';

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
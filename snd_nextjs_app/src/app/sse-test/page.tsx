'use client';

import React, { useState } from 'react';
import { SSEStatus } from '@/components/sse-status';
import { useSSEContext } from '@/contexts/sse-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Activity, 
  Clock, 
  MessageSquare,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function SSETestPage() {
  const { isConnected } = useSSEContext();
  const [eventType, setEventType] = useState('rental_status_updated');
  const [eventData, setEventData] = useState('{"status": "active", "rental_id": 123}');
  const [events, setEvents] = useState<any[]>([]);

  const sendEvent = async (type: string, data: any) => {
    const event = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date()
    };
    setEvents(prev => [event, ...prev]);
    toast.success(`Event sent: ${type}`);
  };

  const handleSendEvent = async () => {
    try {
      const parsedData = JSON.parse(eventData);
      // TODO: sendEvent method doesn't exist in SSE context
      // await sendEvent(eventType as any, parsedData);
      toast.success('Event sending feature not implemented yet!');
    } catch (error) {
      toast.error('Failed to send event. Check your JSON format.');
    }
  };

  const sendTestEvents = async () => {
    // TODO: sendEvent method doesn't exist in SSE context
    // const testEvents = [
    //   {
    //     type: 'rental_status_updated' as const,
    //     data: { status: 'active', rental_id: 123, customer: 'John Doe' }
    //   },
    //   {
    //     type: 'payment_received' as const,
    //     data: { amount: 1500, rental_id: 123, payment_method: 'credit_card' }
    //   },
    //   {
    //     type: 'maintenance_required' as const,
    //     data: { equipment_name: 'Excavator XC-200', issue: 'Engine maintenance due' }
    //   },
    //   {
    //     type: 'rental_overdue' as const,
    //     data: { rental_id: 124, days_overdue: 3, customer: 'Jane Smith' }
    //   },
    //   {
    //     type: 'payroll_processed' as const,
    //     data: { employee_id: 456, amount: 2500, period: '2024-01' }
    //   }
    // ];

    // for (const event of testEvents) {
    //   await sendEvent(event.type, event.data);
    //   await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between events
    // }

    toast.success('Test events feature not implemented yet!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">SSE Test Page</h1>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SSE Status */}
        <SSEStatus showDetails={true} showControls={true} />

        {/* Event Sender */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental_status_updated">Rental Status Updated</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                  <SelectItem value="rental_overdue">Rental Overdue</SelectItem>
                  <SelectItem value="equipment_location_updated">Equipment Location Updated</SelectItem>
                  <SelectItem value="timesheet_updated">Timesheet Updated</SelectItem>
                  <SelectItem value="payroll_processed">Payroll Processed</SelectItem>
                  <SelectItem value="leave_request_updated">Leave Request Updated</SelectItem>
                  <SelectItem value="system_notification">System Notification</SelectItem>
                  <SelectItem value="sync_progress">Sync Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-data">Event Data (JSON)</Label>
              <Textarea
                id="event-data"
                value={eventData}
                onChange={(e) => setEventData(e.target.value)}
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendEvent} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Event
              </Button>
              <Button onClick={sendTestEvents} variant="outline" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Send Test Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Events ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events received yet. Send some test events to see them here.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div key={`${event.id}-${index}`} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {event.id && (
                      <span className="text-xs text-muted-foreground">ID: {event.id}</span>
                    )}
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Test Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendEvent('rental_status_updated', { status: 'completed', rental_id: 123 })}
            >
              Rental Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendEvent('payment_received', { amount: 2500, rental_id: 123 })}
            >
              Payment Received
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendEvent('maintenance_required', { equipment_name: 'Crane CR-100', issue: 'Regular maintenance' })}
            >
              Maintenance Alert
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendEvent('sync_progress', { progress: 75, total: 100, current: 75 })}
            >
              Sync Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
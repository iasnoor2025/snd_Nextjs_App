'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function TestSyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSync = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing sync functionality...');
      
      const response = await fetch('/api/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync failed:', errorText);
        setResult({ error: `HTTP ${response.status}: ${errorText}` });
        toast.error(`Sync failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('Sync result:', data);
      setResult(data);
      
      if (data.success) {
        toast.success(`Sync successful: ${data.message}`);
      } else {
        toast.error(data.message || 'Sync failed');
      }
      
    } catch (error) {
      console.error('Sync error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test ERPNext Sync</h1>
        <p className="text-muted-foreground">Test the customer sync functionality</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Test</CardTitle>
          <CardDescription>
            Test the ERPNext customer sync functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testSync}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing Sync...' : 'Test Sync'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Check</CardTitle>
          <CardDescription>
            Check if ERPNext environment variables are configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>NEXT_PUBLIC_ERPNEXT_URL:</strong> 
              <span className="ml-2">
                {process.env.NEXT_PUBLIC_ERPNEXT_URL ? '✅ Set' : '❌ Not set'}
              </span>
            </div>
            <div>
              <strong>ERPNEXT_API_KEY:</strong> 
              <span className="ml-2">
                {process.env.ERPNEXT_API_KEY ? '✅ Set' : '❌ Not set'}
              </span>
            </div>
            <div>
              <strong>ERPNEXT_API_SECRET:</strong> 
              <span className="ml-2">
                {process.env.ERPNEXT_API_SECRET ? '✅ Set' : '❌ Not set'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
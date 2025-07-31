'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLoginPage() {
  const { data: session, status } = useSession();

  const testSession = async () => {
    try {
      const response = await fetch('/api/test-session', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Session test result:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Session test error:', error);
      alert('Error testing session: ' + error);
    }
  };

  const testBulkApprove = async () => {
    try {
      // First get real timesheet IDs
      const timesheetsResponse = await fetch('/api/test-timesheets', {
        method: 'GET',
        credentials: 'include',
      });
      const timesheetsData = await timesheetsResponse.json();
      
      if (!timesheetsData.success || !timesheetsData.timesheets.length) {
        alert('No timesheets found to test with');
        return;
      }

      // Use the first 3 timesheet IDs for testing
      const testTimesheetIds = timesheetsData.timesheets.slice(0, 3).map((t: any) => t.id);
      
      console.log('Testing with timesheet IDs:', testTimesheetIds);
      
      const response = await fetch('/api/timesheets/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetIds: testTimesheetIds,
          action: 'approve'
        }),
      });
      const data = await response.json();
      console.log('Bulk approve test result:', data);
      console.log('Bulk approve results details:', data.results);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Bulk approve test error:', error);
      alert('Error testing bulk approve: ' + error);
    }
  };

  const testSimpleBulkApprove = async () => {
    try {
      console.log('Testing simple bulk approve API...');
      
      const response = await fetch('/api/test-bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetIds: [40, 39, 38],
          action: 'approve'
        }),
      });
      const data = await response.json();
      console.log('Simple bulk approve test result:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Simple bulk approve test error:', error);
      alert('Error testing simple bulk approve: ' + error);
    }
  };

  const testTimesheets = async () => {
    try {
      const response = await fetch('/api/test-timesheets', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Timesheets test result:', data);
      
      // Show a more readable summary
      const summary = {
        total: data.total,
        statusCounts: data.statusCounts,
        sampleTimesheets: data.timesheets.slice(0, 5).map((t: any) => ({
          id: t.id,
          status: t.status,
          employeeName: t.employeeName,
          date: t.date
        })),
        // Show the specific timesheets we're testing with
        testTimesheets: data.timesheets.slice(0, 3).map((t: any) => ({
          id: t.id,
          status: t.status,
          employeeName: t.employeeName,
          date: t.date
        }))
      };
      
      alert(JSON.stringify(summary, null, 2));
    } catch (error) {
      console.error('Timesheets test error:', error);
      alert('Error testing timesheets: ' + error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Test Page</CardTitle>
          <CardDescription>
            Test if your session is working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Session Status:</h3>
            <p>Status: {status}</p>
            <p>Has Session: {session ? 'Yes' : 'No'}</p>
            {session && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <p><strong>User ID:</strong> {session.user?.id}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Role:</strong> {session.user?.role}</p>
                <p><strong>Name:</strong> {session.user?.name}</p>
              </div>
            )}
          </div>

                             <div className="space-y-2">
                     <Button onClick={testSession} className="w-full">
                       Test Session API
                     </Button>
                     <Button onClick={testTimesheets} className="w-full">
                       Test Timesheets Data
                     </Button>
                     <Button onClick={testSimpleBulkApprove} className="w-full">
                       Test Simple Bulk Approve API
                     </Button>
                     <Button onClick={testBulkApprove} className="w-full">
                       Test Full Bulk Approve API
                     </Button>
                   </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Make sure you're logged in as admin@ias.com</li>
              <li>2. Click "Test Session API" to check if session works</li>
              <li>3. Click "Test Bulk Approve API" to test the bulk approve endpoint</li>
              <li>4. Check the browser console for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
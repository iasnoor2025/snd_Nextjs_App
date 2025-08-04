'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 DEBUG SESSION - Status:', status);
    console.log('🔍 DEBUG SESSION - Session:', session);
    console.log('🔍 DEBUG SESSION - User:', session?.user);
    console.log('🔍 DEBUG SESSION - Role:', session?.user?.role);
  }, [session, status]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    console.log('🔍 DEBUG SESSION - Logged out');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Session Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Session Information</h2>
          
          <div className="space-y-2">
            <div>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                status === 'authenticated' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {status}
              </span>
            </div>
            
            <div>
              <strong>User Email:</strong> {session?.user?.email || 'No email'}
            </div>
            
            <div>
              <strong>User Name:</strong> {session?.user?.name || 'No name'}
            </div>
            
            <div>
              <strong>User Role:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                session?.user?.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                session?.user?.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                session?.user?.role === 'MANAGER' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {session?.user?.role || 'No role'}
              </span>
            </div>
            
            <div>
              <strong>User ID:</strong> {session?.user?.id || 'No ID'}
            </div>
            
            <div>
              <strong>Is Active:</strong> {session?.user?.isActive ? 'Yes' : 'No'}
            </div>
          </div>
          
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Raw Session Data</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check the console for debug messages</li>
          <li>Verify the role is correctly assigned</li>
          <li>If role is wrong, logout and login again</li>
          <li>Check the browser's Network tab for API calls</li>
        </ol>
      </div>
    </div>
  );
} 
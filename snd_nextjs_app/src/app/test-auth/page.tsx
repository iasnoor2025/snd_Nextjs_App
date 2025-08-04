'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 TEST AUTH - Status:', status);
    console.log('🔍 TEST AUTH - Session:', session);
    console.log('🔍 TEST AUTH - User:', session?.user);
    console.log('🔍 TEST AUTH - Role:', session?.user?.role);
  }, [session, status]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    console.log('🔍 TEST AUTH - Logged out');
  };

  const handleLogin = async () => {
    // Remove hardcoded credentials - let user input them
    const email = prompt('Enter email:');
    const password = prompt('Enter password:');
    
    if (!email || !password) {
      console.log('🔍 TEST AUTH - Login cancelled');
      return;
    }
    
    await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    console.log('🔍 TEST AUTH - Login attempt');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>User Role:</strong> {session?.user?.role || 'No role'}
        </div>
        
        <div>
          <strong>User Email:</strong> {session?.user?.email || 'No email'}
        </div>
        
        <div>
          <strong>User Name:</strong> {session?.user?.name || 'No name'}
        </div>
        
        <div className="flex gap-4">
          <Button onClick={handleLogout}>
            Logout
          </Button>
          <Button onClick={handleLogin}>
            Login as Admin
          </Button>
        </div>
      </div>
    </div>
  );
} 
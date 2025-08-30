'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function RBACInitializer() {
  const { data: session, status: authStatus } = useSession();
  const [status, setStatus] = useState<'checking' | 'initializing' | 'completed' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    // Only run RBAC initialization after authentication is confirmed
    if (authStatus === 'loading') {
      console.log('⏳ Waiting for authentication to complete...');
      return; // Still loading, wait
    }
    
    if (authStatus === 'unauthenticated') {
      console.log('🚫 User not authenticated, skipping RBAC initialization');
      // User is not authenticated, skip RBAC initialization
      setStatus('completed');
      return;
    }

    // Ensure we have a valid session with user data
    if (!session?.user) {
      console.log('⚠️ No user data in session, skipping RBAC initialization');
      setStatus('completed');
      return;
    }

    console.log('✅ Authentication confirmed, proceeding with RBAC initialization');

    const initializeRBAC = async () => {
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        // Check if we already know the RBAC status from this session
        const cachedStatus = sessionStorage.getItem('rbac-status');
        const lastCheck = sessionStorage.getItem('rbac-last-check');
        const now = Date.now();
        
        // If we checked within the last 5 minutes, use cached status
        if (cachedStatus && lastCheck && (now - parseInt(lastCheck)) < 300000) {
          console.log('📋 Using cached RBAC status:', cachedStatus);
          setStatus('completed');
          setMessage('RBAC system ready (cached)');
          return;
        }

        // Silent check - don't show UI unless there's an issue
        setStatus('checking');
        setMessage('Checking RBAC system status...');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000); // Reduced to 5 seconds
        });

        // First check if RBAC system is already initialized
        console.log('🔍 Checking RBAC system status...');
        const checkPromise = fetch('/api/rbac/initialize');
        const checkResponse = await Promise.race([checkPromise, timeoutPromise]) as Response;
        
        console.log('📡 Status check response:', {
          status: checkResponse.status,
          statusText: checkResponse.statusText,
          headers: Object.fromEntries(checkResponse.headers.entries())
        });
        
        if (!checkResponse.ok) {
          const errorText = await checkResponse.text();
          console.error('❌ Status check failed:', {
            status: checkResponse.status,
            statusText: checkResponse.statusText,
            responseText: errorText
          });
          throw new Error(`Status check failed: ${checkResponse.status} ${checkResponse.statusText}`);
        }
        
        let checkData;
        try {
          const responseText = await checkResponse.text();
          console.log('📄 Raw response text:', responseText);
          checkData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          throw new Error('Invalid response from server');
        }
        
        console.log('RBAC status check response:', checkData);

        // Cache the status
        sessionStorage.setItem('rbac-status', checkData.initialized ? 'initialized' : 'needs-init');
        sessionStorage.setItem('rbac-last-check', now.toString());

        // If already initialized, just complete
        if (checkData.initialized) {
          setStatus('completed');
          setMessage('RBAC system is already initialized');
          return;
        }

        // Only initialize if NOT already initialized
        setStatus('initializing');
        setMessage('Initializing RBAC system...');
        setShowUI(true); // Show UI only when actually initializing

        const initPromise = fetch('/api/rbac/initialize', {
          method: 'POST',
        });
        const initResponse = await Promise.race([initPromise, timeoutPromise]) as Response;

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          throw new Error(`Initialization failed: ${initResponse.status} ${initResponse.statusText} - ${errorText}`);
        }

        let initData;
        try {
          const responseText = await initResponse.text();
          initData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Invalid response from server');
        }

        console.log('RBAC initialization response:', initData);

        if (initData.success) {
          setStatus('completed');
          setMessage('RBAC system initialized successfully');
          // Update cache
          sessionStorage.setItem('rbac-status', 'initialized');
          // Hide UI after successful initialization
          setTimeout(() => setShowUI(false), 2000);
        } else {
          throw new Error(initData.message || 'Initialization failed');
        }
      } catch (error) {
        const newErrorCount = parseInt(sessionStorage.getItem('rbac-error-count') || '0') + 1;
        sessionStorage.setItem('rbac-error-count', newErrorCount.toString());
        
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMessage(`RBAC initialization failed: ${errorMessage}`);
        console.error('RBAC initialization error:', error);
        
        // Show UI for errors
        setShowUI(true);
        
        // After 3 errors, hide the component to prevent blocking the UI
        if (newErrorCount >= 3) {
          console.warn('RBAC initializer failed 3 times, hiding component to prevent UI blocking');
          setStatus('completed');
          setShowUI(false);
          // Clear error count after hiding
          sessionStorage.removeItem('rbac-error-count');
        }
      }
    };

    // Initialize RBAC system on component mount
    initializeRBAC();
  }, [authStatus]);

  // Show loading state while waiting for authentication
  if (authStatus === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-700">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not showing UI
  if (!showUI) {
    return null;
  }

  // Only show status during initialization process
  if (status === 'completed' && !message.includes('error')) {
    return null; // Don't render anything when completed successfully
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div className="mb-4">
          {status === 'checking' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === 'initializing' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          )}
          {status === 'error' && (
            <div className="text-red-600 text-4xl">⚠️</div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {status === 'checking' && 'Checking RBAC System'}
          {status === 'initializing' && 'Initializing RBAC System'}
          {status === 'error' && 'RBAC System Error'}
        </h3>
        
        <p className="text-gray-600 mb-4">{message}</p>
        
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              You can manually initialize the RBAC system via the API endpoint:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              POST /api/rbac/initialize
            </code>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <p className="text-xs text-gray-400">
              Attempt {parseInt(sessionStorage.getItem('rbac-error-count') || '0')}/3 - Component will hide after 3 failures
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

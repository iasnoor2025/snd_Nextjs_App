'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { ChatProvider } from '@/contexts/chat-context';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import React from 'react';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatProvider>
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-80 border-r">
            <ChatSidebar />
          </div>
          <div className="flex-1">
            <ChatWindow />
          </div>
        </div>
      </ChatProvider>
    </ProtectedRoute>
  );
}


'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { ChatProvider, useChat } from '@/contexts/chat-context';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function ChatContent() {
  const { selectConversation } = useChat();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    if (conversationId) {
      const id = parseInt(conversationId);
      if (!isNaN(id)) {
        selectConversation(id);
      }
    }
  }, [conversationId, selectConversation]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r">
        <ChatSidebar />
      </div>
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatProvider>
        <ChatContent />
      </ChatProvider>
    </ProtectedRoute>
  );
}


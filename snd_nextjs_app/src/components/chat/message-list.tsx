'use client';

import { useChat } from '@/contexts/chat-context';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useRef } from 'react';
import { MessageItem } from './message-item';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const MessageList: React.FC<{ conversationId: number }> = ({ conversationId }) => {
  const { messages, currentConversation, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationMessages = messages.get(conversationId) || [];
  const typing = typingUsers.get(conversationId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-2">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {conversationMessages.map((message, index) => {
        const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
        const showAvatar =
          !prevMessage ||
          prevMessage.senderId !== message.senderId ||
          new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() >
            5 * 60 * 1000; // 5 minutes

        return (
          <MessageItem
            key={message.id}
            message={message}
            showAvatar={showAvatar}
            isOwnMessage={false} // Will be determined by current user
            conversationId={conversationId}
          />
        );
      })}
      {typing && typing.size > 0 && (
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
          <div className="flex gap-1 bg-muted rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};


'use client';

import { useChat } from '@/contexts/chat-context';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useRef } from 'react';
import { MessageItem } from './message-item';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

export const MessageList: React.FC<{ conversationId: number }> = ({ conversationId }) => {
  const { messages, currentConversation, typingUsers, typingUsersInfo, loading } = useChat();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationMessages = messages.get(conversationId) || [];
  const typing = typingUsers.get(conversationId);
  const typingInfo = typingUsersInfo.get(conversationId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  // Show loading state
  if (loading && conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground max-w-sm">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground mb-1">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message below!</p>
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

        // Determine if message is from current user
        const isOwnMessage = message.sender.email === session?.user?.email;

        return (
          <MessageItem
            key={message.id}
            message={message}
            showAvatar={showAvatar}
            isOwnMessage={isOwnMessage}
            conversationId={conversationId}
          />
        );
      })}
      {typing && typing.size > 0 && (() => {
        // Get first typing user (for now, show first one)
        const typingUserId = Array.from(typing)[0];
        const userInfo = typingInfo?.get(typingUserId);
        const userName = userInfo?.name || 'Someone';
        const userAvatar = userInfo?.avatar;

        // Capitalize first letter of each word
        const capitalizeName = (name: string): string => {
          if (!name) return name;
          return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        };

        return (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback>
                {userName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={cn('flex gap-1 bg-muted rounded-lg px-3 py-2')}>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground">{capitalizeName(userName)} is typing...</span>
          </div>
        );
      })()}
      <div ref={messagesEndRef} />
    </div>
  );
};


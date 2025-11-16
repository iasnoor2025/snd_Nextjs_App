'use client';

import { useChat } from '@/contexts/chat-context';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useRef } from 'react';
import { MessageItem } from './message-item';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

export const MessageList: React.FC<{ conversationId: number }> = ({ conversationId }) => {
  const { messages, currentConversation, typingUsers, typingUsersInfo } = useChat();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationMessages = messages.get(conversationId) || [];
  const typing = typingUsers.get(conversationId);
  const typingInfo = typingUsersInfo.get(conversationId);

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


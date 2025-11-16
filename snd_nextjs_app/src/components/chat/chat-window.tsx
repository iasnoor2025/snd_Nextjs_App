'use client';

import { useChat } from '@/contexts/chat-context';
import React from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { useSession } from 'next-auth/react';

export const ChatWindow: React.FC = () => {
  const { currentConversation } = useChat();
  const { data: session } = useSession();

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  // Find the other participant for direct messages
  const otherParticipant =
    currentConversation.type === 'direct'
      ? currentConversation.participants.find(p => p.email !== session?.user?.email)
      : null;

  const displayName =
    currentConversation.type === 'direct'
      ? otherParticipant?.name || otherParticipant?.email || 'Unknown'
      : currentConversation.name || 'Group Chat';

  const displayAvatar =
    currentConversation.type === 'direct' ? otherParticipant?.avatar : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayAvatar || undefined} />
            <AvatarFallback>
              {displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            {currentConversation.type === 'group' && (
              <p className="text-xs text-muted-foreground">
                {currentConversation.participants.length} participants
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <MessageList conversationId={currentConversation.id} />

      {/* Input */}
      <MessageInput conversationId={currentConversation.id} />
    </div>
  );
};


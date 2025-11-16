'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/chat-context';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { NewConversationDialog } from './new-conversation-dialog';

export const ChatSidebar: React.FC = () => {
  const { conversations, currentConversation, selectConversation, loading, error } = useChat();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      conv.name?.toLowerCase().includes(searchLower) ||
      conv.participants.some(p => p.name?.toLowerCase().includes(searchLower) || p.email?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button
          size="icon"
          variant="ghost"
          title="New Conversation"
          onClick={() => setNewConversationOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        )}
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {search ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map(conversation => {
              // For direct messages, find the other participant (not the current user)
              let otherParticipant = null;
              if (conversation.type === 'direct' && conversation.participants.length >= 2) {
                // Find participant that is not the current user
                otherParticipant = conversation.participants.find(
                  p => p.email !== session?.user?.email
                ) || conversation.participants[0];
              }

              const displayName =
                conversation.type === 'direct'
                  ? otherParticipant?.name || otherParticipant?.email || 'Unknown'
                  : conversation.name || 'Group Chat';

              const displayAvatar =
                conversation.type === 'direct'
                  ? otherParticipant?.avatar
                  : null;

              const isActive = currentConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left hover:bg-accent transition-colors',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        {conversation.lastMessage && (() => {
                          // Parse timestamp - handle timezone issues
                          let createdAt: Date;
                          try {
                            const timestamp = conversation.lastMessage.createdAt;
                            if (!timestamp) {
                              createdAt = new Date();
                            } else if (typeof timestamp === 'string') {
                              // If it's already an ISO string with timezone, use it directly
                              if (timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('T')) {
                                createdAt = new Date(timestamp);
                              } else {
                                // Database timestamp without timezone - treat as UTC
                                createdAt = new Date(timestamp + 'Z');
                              }
                            } else {
                              createdAt = new Date(timestamp);
                            }
                            
                            // Validate the date
                            if (isNaN(createdAt.getTime())) {
                              createdAt = new Date();
                            }
                          } catch (e) {
                            console.error('Error parsing timestamp:', conversation.lastMessage.createdAt, e);
                            createdAt = new Date();
                          }
                          
                          const now = new Date();
                          const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
                          
                          // Show "just now" for messages less than 1 minute old
                          if (diffInSeconds >= 0 && diffInSeconds < 60) {
                            return <span className="text-xs text-muted-foreground ml-2">just now</span>;
                          }
                          
                          return (
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDistanceToNow(createdAt, { addSuffix: true })}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
      />
    </div>
  );
};


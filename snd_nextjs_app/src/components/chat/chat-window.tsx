'use client';

import { useChat } from '@/contexts/chat-context';
import React from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, User, Bell, BellOff, Archive, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export const ChatWindow: React.FC = () => {
  const { currentConversation, isUserOnline, muteConversation, deleteConversation, selectConversation } = useChat();
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isMuting, setIsMuting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleMute = async (muted: boolean) => {
    if (!currentConversation || isMuting) return;
    setIsMuting(true);
    try {
      await muteConversation(currentConversation.id, muted);
    } catch (error) {
      console.error('Failed to mute/unmute conversation:', error);
    } finally {
      setIsMuting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentConversation || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteConversation(currentConversation.id);
      setDeleteDialogOpen(false);
      // Select first conversation if available, or leave empty
      // The context will handle clearing the current conversation
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleViewProfile = () => {
    if (currentConversation?.type === 'direct' && otherParticipant) {
      router.push(`/user-management?userId=${otherParticipant.id}`);
    }
  };

  // Capitalize first letter of each word in the name
  const capitalizeName = (name: string): string => {
    if (!name) return name;
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const displayName =
    currentConversation.type === 'direct'
      ? capitalizeName(otherParticipant?.name || otherParticipant?.email || 'Unknown')
      : capitalizeName(currentConversation.name || 'Group Chat');

  const displayAvatar =
    currentConversation.type === 'direct' ? otherParticipant?.avatar : null;

  const isMuted = currentConversation.isMuted || false;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <div className="relative">
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
            {currentConversation.type === 'direct' && otherParticipant && (
              <div
                className={cn(
                  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                  isUserOnline(otherParticipant.id) ? 'bg-green-500' : 'bg-gray-400'
                )}
                title={isUserOnline(otherParticipant.id) ? 'Online' : 'Offline'}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{displayName}</h3>
              {currentConversation.type === 'direct' && otherParticipant && (
                <span className="text-xs text-muted-foreground">
                  {isUserOnline(otherParticipant.id) ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
            {currentConversation.type === 'group' && (
              <p className="text-xs text-muted-foreground">
                {currentConversation.participants.length} participants
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentConversation.type === 'direct' && otherParticipant && (
              <>
                <DropdownMenuItem onClick={handleViewProfile}>
                  <User className="h-4 w-4 mr-2" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isMuted ? (
              <DropdownMenuItem onClick={() => handleMute(true)} disabled={isMuting}>
                <Bell className="h-4 w-4 mr-2" />
                <span>Mute Notifications</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleMute(false)} disabled={isMuting}>
                <BellOff className="h-4 w-4 mr-2" />
                <span>Unmute Notifications</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Delete Conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <MessageList conversationId={currentConversation.id} />

      {/* Input */}
      <MessageInput conversationId={currentConversation.id} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and you will be removed from this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


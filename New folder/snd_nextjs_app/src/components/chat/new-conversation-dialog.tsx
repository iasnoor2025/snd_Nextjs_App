'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChat } from '@/contexts/chat-context';
import { Search, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { searchUsers, createConversation, selectConversation } = useChat();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (open && search.trim().length > 0) {
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchUsers(search);
          setUsers(results);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (open && search.trim().length === 0) {
      setUsers([]);
    }
  }, [search, open, searchUsers]);

  const handleUserSelect = (userId: number) => {
    if (conversationType === 'direct') {
      setSelectedUserIds([userId]);
    } else {
      setSelectedUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      const conversationId = await createConversation(
        selectedUserIds,
        conversationType,
        conversationType === 'group' ? groupName : undefined
      );
      await selectConversation(conversationId);
      onOpenChange(false);
      setSearch('');
      setUsers([]);
      setSelectedUserIds([]);
      setGroupName('');
      setConversationType('direct');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Start a new chat with a user or create a group</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Conversation Type */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={conversationType === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setConversationType('direct');
                if (selectedUserIds.length > 1) {
                  setSelectedUserIds([selectedUserIds[0]]);
                }
              }}
            >
              Direct Message
            </Button>
            <Button
              type="button"
              variant={conversationType === 'group' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConversationType('group')}
            >
              Group Chat
            </Button>
          </div>

          {/* Group Name */}
          {conversationType === 'group' && (
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* User Results */}
          {search.trim().length > 0 && (
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="p-2">
                  {users.map(user => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className={`w-full p-2 rounded-lg text-left hover:bg-accent transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>
                              {user.name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                            {user.name && (
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-xs text-primary-foreground">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selected Users */}
          {selectedUserIds.length > 0 && (
            <div className="space-y-2">
              <Label>Selected ({selectedUserIds.length})</Label>
              <div className="flex flex-wrap gap-2">
                {users
                  .filter(u => selectedUserIds.includes(u.id))
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-sm"
                    >
                      <span>{user.name || user.email}</span>
                      <button
                        onClick={() => handleUserSelect(user.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={selectedUserIds.length === 0}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


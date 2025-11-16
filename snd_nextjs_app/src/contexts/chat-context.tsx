'use client';

import { ChatService, ChatConversation, ChatMessage, ChatUser } from '@/lib/services/chat-service';
import { useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSSEContext } from './sse-context';

interface ChatContextType {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: Map<number, ChatMessage[]>; // conversationId -> messages
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string, replyToId?: number) => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number, conversationId: number) => Promise<void>;
  markAsRead: (messageId: number) => Promise<void>;
  markConversationAsRead: (conversationId: number) => Promise<void>;
  searchUsers: (search: string) => Promise<ChatUser[]>;
  createConversation: (participantIds: number[], type?: 'direct' | 'group', name?: string) => Promise<number>;
  typingUsers: Map<number, Set<number>>; // conversationId -> Set of userIds
  typingUsersInfo: Map<number, Map<number, { name: string; avatar?: string | null }>>; // conversationId -> userId -> userInfo
  setTyping: (conversationId: number, isTyping: boolean) => Promise<void>;
  onlineUsers: Set<number>; // Set of online user IDs
  isUserOnline: (userId: number) => boolean;
  muteConversation: (conversationId: number, muted: boolean) => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const { isConnected } = useSSEContext();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  const [typingUsersInfo, setTypingUsersInfo] = useState<Map<number, Map<number, { name: string; avatar?: string | null }>>>(new Map()); // conversationId -> userId -> userInfo
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const currentUserIdRef = useRef<number | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ChatService.getConversations();
      setConversations(data || []);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load conversations';
      setError(errorMessage);
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Select conversation and load messages
  const selectConversation = useCallback(async (conversationId: number) => {
    // Prevent multiple simultaneous calls for the same conversation
    if (currentConversation?.id === conversationId && loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get conversation details
      const conversation = await ChatService.getConversation(conversationId);
      setCurrentConversation(conversation);

      // Always load messages (they might have been updated)
      const { messages: conversationMessages } = await ChatService.getMessages(conversationId);
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(conversationId, conversationMessages);
        return newMap;
      });

      // Mark all messages in this conversation as read (and related notifications)
      try {
        await ChatService.markConversationAsRead(conversationId);
        
        // Update local state - mark all messages as read
        setMessages(prev => {
          const newMap = new Map(prev);
          const conversationMessages = newMap.get(conversationId) || [];
          const updated = conversationMessages.map(msg => ({ ...msg, isRead: true }));
          newMap.set(conversationId, updated);
          return newMap;
        });

        // Update conversation unread count
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      } catch (err) {
        console.error('Failed to mark conversation as read:', err);
        // Don't fail the whole operation if marking as read fails
      }
    } catch (err) {
      setError('Failed to load conversation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentConversation?.id, loading]);

  // Send message
  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
      messageType: 'text' | 'image' | 'file' = 'text',
      file?: { url: string; name: string; size: number },
      replyToId?: number
    ) => {
      try {
        const message = await ChatService.sendMessage(conversationId, {
          content,
          messageType,
          fileUrl: file?.url,
          fileName: file?.name,
          fileSize: file?.size,
          replyToId,
        });

        // Add message to local state
        setMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(conversationId) || [];
          newMap.set(conversationId, [...existing, message]);
          return newMap;
        });

        // Update conversation's last message
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    id: message.id,
                    content: message.content,
                    createdAt: message.createdAt,
                    senderId: message.senderId,
                  },
                  lastMessageAt: message.createdAt,
                  updatedAt: message.createdAt,
                }
              : conv
          )
        );
      } catch (err) {
        setError('Failed to send message');
        console.error(err);
        throw err;
      }
    },
    []
  );

  // Edit message
  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      await ChatService.editMessage(messageId, content);

      // Update message in local state
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.forEach((msgs, convId) => {
          const updated = msgs.map(msg =>
            msg.id === messageId ? { ...msg, content, isEdited: true } : msg
          );
          newMap.set(convId, updated);
        });
        return newMap;
      });
    } catch (err) {
      setError('Failed to edit message');
      console.error(err);
      throw err;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: number, conversationId: number) => {
    try {
      const response = await ChatService.deleteMessage(messageId);
      const deletedAt = response?.deletedAt || new Date().toISOString();

      // Update message in local state to mark as deleted
      setMessages(prev => {
        const newMap = new Map(prev);
        const conversationMessages = newMap.get(conversationId) || [];
        const updated = conversationMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted.', deletedAt }
            : msg
        );
        newMap.set(conversationId, updated);
        return newMap;
      });

      // Update conversation's last message if needed
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationId && conv.lastMessage?.id === messageId) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                content: 'This message was deleted.',
              },
            };
          }
          return conv;
        })
      );
    } catch (err) {
      setError('Failed to delete message');
      console.error(err);
      throw err;
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await ChatService.markMessageAsRead(messageId);

      // Update message in local state
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.forEach((msgs, convId) => {
          const updated = msgs.map(msg =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          );
          newMap.set(convId, updated);
        });
        return newMap;
      });
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Mark all messages in a conversation as read
  const markConversationAsRead = useCallback(async (conversationId: number) => {
    try {
      await ChatService.markConversationAsRead(conversationId);

      // Update local state - mark all messages as read
      setMessages(prev => {
        const newMap = new Map(prev);
        const conversationMessages = newMap.get(conversationId) || [];
        const updated = conversationMessages.map(msg => ({ ...msg, isRead: true }));
        newMap.set(conversationId, updated);
        return newMap;
      });

      // Update conversation unread count
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (search: string): Promise<ChatUser[]> => {
    try {
      return await ChatService.searchUsers(search);
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  }, []);

  // Create conversation
  const createConversation = useCallback(
    async (
      participantIds: number[],
      type: 'direct' | 'group' = 'direct',
      name?: string
    ): Promise<number> => {
      try {
        const { id } = await ChatService.createConversation({
          type,
          participantIds,
          name,
        });
        await fetchConversations();
        return id;
      } catch (err) {
        setError('Failed to create conversation');
        console.error(err);
        throw err;
      }
    },
    [fetchConversations]
  );

  // Set typing indicator
  const setTyping = useCallback(async (conversationId: number, isTyping: boolean) => {
    if (!session?.user?.email) return;

    // Broadcast typing event to other users via API
    try {
      await ChatService.sendTypingIndicator(conversationId, isTyping);
    } catch (err) {
      console.error('Failed to send typing indicator:', err);
      // Continue with local state update even if API call fails
    }

    // Clear existing timeout
    const existingTimeout = typingTimeoutRef.current.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Note: We don't add current user to typingUsers - only other users' typing indicators are shown
    // The API will broadcast to other users, and we'll receive their typing events via SSE
  }, [session]);

  // Fetch initial online status
  const fetchOnlineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/users/online');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const onlineIds = new Set(result.data.map((u: any) => Number(u.id)));
          setOnlineUsers(onlineIds);
        }
      }
    } catch (err) {
      console.error('Failed to fetch online status:', err);
    }
  }, []);

  // Listen to SSE chat events
  useEffect(() => {
    if (!isConnected) return;

    const handleChatEvent = (event: CustomEvent) => {
      console.log('Chat event received:', event.detail.type, event.detail);
      try {
        const data = event.detail;
        
        // Handle online/offline status
        if (data.type === 'user:online' || data.type === 'user:offline') {
          const userId = data.data?.userId;
          if (userId) {
            const userIdNum = Number(userId);
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              if (data.type === 'user:online') {
                newSet.add(userIdNum);
              } else {
                newSet.delete(userIdNum);
              }
              return newSet;
            });
          }
          return;
        }

        // Handle typing indicator
        if (data.type === 'chat:typing' && data.data) {
          const { conversationId, userId, userName, isTyping } = data.data;
          const currentUserId = currentUserIdRef.current;

          // Don't show typing indicator for current user
          if (currentUserId && userId === currentUserId) {
            return;
          }

          if (isTyping) {
            // Add typing user
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              const users = newMap.get(conversationId) || new Set();
              users.add(userId);
              newMap.set(conversationId, users);
              return newMap;
            });

            // Store user info
            setTypingUsersInfo(prev => {
              const newMap = new Map(prev);
              const usersInfo = newMap.get(conversationId) || new Map();
              usersInfo.set(userId, { name: userName || 'Someone', avatar: null });
              newMap.set(conversationId, usersInfo);
              return newMap;
            });

            // Auto-remove after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => {
                const newMap = new Map(prev);
                const users = newMap.get(conversationId) || new Set();
                users.delete(userId);
                if (users.size === 0) {
                  newMap.delete(conversationId);
                } else {
                  newMap.set(conversationId, users);
                }
                return newMap;
              });
              setTypingUsersInfo(prev => {
                const newMap = new Map(prev);
                const usersInfo = newMap.get(conversationId);
                if (usersInfo) {
                  usersInfo.delete(userId);
                  if (usersInfo.size === 0) {
                    newMap.delete(conversationId);
                  } else {
                    newMap.set(conversationId, usersInfo);
                  }
                }
                return newMap;
              });
            }, 3000);
          } else {
            // Remove typing user
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              const users = newMap.get(conversationId) || new Set();
              users.delete(userId);
              if (users.size === 0) {
                newMap.delete(conversationId);
              } else {
                newMap.set(conversationId, users);
              }
              return newMap;
            });
            setTypingUsersInfo(prev => {
              const newMap = new Map(prev);
              const usersInfo = newMap.get(conversationId);
              if (usersInfo) {
                usersInfo.delete(userId);
                if (usersInfo.size === 0) {
                  newMap.delete(conversationId);
                } else {
                  newMap.set(conversationId, usersInfo);
                }
              }
              return newMap;
            });
          }
          return;
        }

        // Handle new conversation created
        if (data.type === 'chat:conversation_created' && data.data) {
          const { conversationId } = data.data;
          // Refresh conversations list to include the new conversation
          fetchConversations();
          return;
        }
        
        if (data.type === 'chat:message' && data.data?.message) {
          const message: ChatMessage = data.data.message;
          const conversationId = data.data.conversationId;

          // Add message to local state
          setMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(conversationId) || [];
            // Check if message already exists
            if (!existing.find(m => m.id === message.id)) {
              newMap.set(conversationId, [...existing, message]);
            }
            return newMap;
          });

          // Update conversation's last message
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: {
                      id: message.id,
                      content: message.content,
                      createdAt: message.createdAt,
                      senderId: message.senderId,
                    },
                    lastMessageAt: message.createdAt,
                    updatedAt: message.createdAt,
                    unreadCount: conv.id === currentConversation?.id ? 0 : conv.unreadCount + 1,
                  }
                : conv
            )
          );
        }
      } catch (err) {
        console.error('Error handling chat event:', err);
      }
    };

    // Listen for chat events
    window.addEventListener('chat-event', handleChatEvent as EventListener);

    // Refresh online status when SSE connects
    if (isConnected) {
      fetchOnlineStatus();
    }

    return () => {
      window.removeEventListener('chat-event', handleChatEvent as EventListener);
    };
  }, [isConnected, currentConversation, fetchOnlineStatus]);

  // Periodically refresh online status (every 30 seconds)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchOnlineStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, fetchOnlineStatus]);

  // Check if user is online
  const isUserOnline = useCallback((userId: number): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Mute/unmute conversation
  const muteConversation = useCallback(async (conversationId: number, muted: boolean) => {
    try {
      await ChatService.muteConversation(conversationId, muted);
      
      // Update conversation in local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, isMuted: muted } : conv
        )
      );

      // Update current conversation if it's the one being muted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, isMuted: muted } : null);
      }
    } catch (err) {
      setError(`Failed to ${muted ? 'mute' : 'unmute'} conversation`);
      console.error(err);
      throw err;
    }
  }, [currentConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: number) => {
    try {
      await ChatService.deleteConversation(conversationId);
      
      // Remove conversation from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }

      // Remove messages for this conversation
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
      throw err;
    }
  }, [currentConversation]);

  // Get current user ID from conversations
  useEffect(() => {
    if (session?.user?.email && conversations.length > 0 && !currentUserIdRef.current) {
      // Get user ID from first conversation's participants
      const firstConv = conversations[0];
      const currentUserParticipant = firstConv.participants.find(p => p.email === session.user.email);
      if (currentUserParticipant) {
        currentUserIdRef.current = currentUserParticipant.id;
      }
    }
  }, [conversations, session?.user?.email]);

  // Fetch conversations on mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchConversations();
      fetchOnlineStatus();
    }
  }, [session, fetchConversations, fetchOnlineStatus]);

  // Periodically refresh conversations list (every 60 seconds) to catch new conversations
  useEffect(() => {
    if (!session?.user?.email || !isConnected) return;

    const interval = setInterval(() => {
      fetchConversations();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [session, isConnected, fetchConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        loading,
        error,
        fetchConversations,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        markAsRead,
        markConversationAsRead,
        searchUsers,
        createConversation,
        typingUsers,
        typingUsersInfo,
        setTyping,
        onlineUsers,
        isUserOnline,
        muteConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};


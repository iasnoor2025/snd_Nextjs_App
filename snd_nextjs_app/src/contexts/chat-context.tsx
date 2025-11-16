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
  searchUsers: (search: string) => Promise<ChatUser[]>;
  createConversation: (participantIds: number[], type?: 'direct' | 'group', name?: string) => Promise<number>;
  typingUsers: Map<number, Set<number>>; // conversationId -> Set of userIds
  setTyping: (conversationId: number, isTyping: boolean) => void;
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
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

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
    try {
      setLoading(true);
      setError(null);

      // Get conversation details
      const conversation = await ChatService.getConversation(conversationId);
      setCurrentConversation(conversation);

      // Load messages if not already loaded
      if (!messages.has(conversationId)) {
        const { messages: conversationMessages } = await ChatService.getMessages(conversationId);
        setMessages(prev => {
          const newMap = new Map(prev);
          newMap.set(conversationId, conversationMessages);
          return newMap;
        });
      }
    } catch (err) {
      setError('Failed to load conversation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [messages]);

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
      await ChatService.deleteMessage(messageId);

      // Update message in local state to mark as deleted
      setMessages(prev => {
        const newMap = new Map(prev);
        const conversationMessages = newMap.get(conversationId) || [];
        const updated = conversationMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted.', deletedAt: new Date().toISOString() }
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
  const setTyping = useCallback((conversationId: number, isTyping: boolean) => {
    if (!session?.user?.email) return;

    // Clear existing timeout
    const existingTimeout = typingTimeoutRef.current.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (isTyping) {
      // Set typing for 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const users = newMap.get(conversationId) || new Set();
          users.delete(0); // Remove current user (we'll use proper user ID later)
          if (users.size === 0) {
            newMap.delete(conversationId);
          } else {
            newMap.set(conversationId, users);
          }
          return newMap;
        });
        typingTimeoutRef.current.delete(conversationId);
      }, 3000);

      typingTimeoutRef.current.set(conversationId, timeout);

      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const users = newMap.get(conversationId) || new Set();
        users.add(0); // Temporary, will use proper user ID
        newMap.set(conversationId, users);
        return newMap;
      });
    } else {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const users = newMap.get(conversationId) || new Set();
        users.delete(0);
        if (users.size === 0) {
          newMap.delete(conversationId);
        } else {
          newMap.set(conversationId, users);
        }
        return newMap;
      });
    }
  }, [session]);

  // Listen to SSE chat events
  useEffect(() => {
    if (!isConnected) return;

    const handleChatEvent = (event: CustomEvent) => {
      try {
        const data = event.detail;
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

    return () => {
      window.removeEventListener('chat-event', handleChatEvent as EventListener);
    };
  }, [isConnected, currentConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchConversations();
    }
  }, [session, fetchConversations]);

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
        searchUsers,
        createConversation,
        typingUsers,
        setTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};


import ApiService from '@/lib/api-service';

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  replyToId?: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
  isRead: boolean;
}

export interface ChatConversation {
  id: number;
  type: 'direct' | 'group';
  name?: string | null;
  participants: ChatUser[];
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  } | null;
  unreadCount: number;
  updatedAt: string;
  lastMessageAt?: string | null;
}

export interface CreateConversationRequest {
  type?: 'direct' | 'group';
  participantIds: number[];
  name?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: number;
}

export class ChatService {
  // Get all conversations for current user
  static async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await ApiService.get('/chat/conversations', undefined, {
        errorMessage: 'Failed to load conversations',
        showToast: false, // Don't show toast for this, handle in UI
      });
      return response.data || [];
    } catch (error: any) {
      // Re-throw with more context
      if (error?.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  // Get conversation by ID
  static async getConversation(id: number): Promise<ChatConversation> {
    const response = await ApiService.get(`/chat/conversations/${id}`, undefined, {
      errorMessage: 'Failed to load conversation',
    });
    return response.data;
  }

  // Create new conversation
  static async createConversation(
    data: CreateConversationRequest
  ): Promise<{ id: number }> {
    const response = await ApiService.post('/chat/conversations', data, {
      errorMessage: 'Failed to create conversation',
    });
    return response.data;
  }

  // Get messages for a conversation
  static async getMessages(
    conversationId: number,
    options?: { page?: number; per_page?: number; before?: number }
  ): Promise<{ messages: ChatMessage[]; pagination: { hasMore: boolean; nextCursor: number | null } }> {
    const response = await ApiService.get(
      `/chat/conversations/${conversationId}/messages`,
      options,
      {
        errorMessage: 'Failed to load messages',
      }
    );
    return response.data;
  }

  // Send a message
  static async sendMessage(
    conversationId: number,
    data: SendMessageRequest
  ): Promise<ChatMessage> {
    const response = await ApiService.post(
      `/chat/conversations/${conversationId}/messages`,
      data,
      {
        errorMessage: 'Failed to send message',
      }
    );
    return response.data;
  }

  // Edit a message
  static async editMessage(messageId: number, content: string): Promise<ChatMessage> {
    const response = await ApiService.put(`/chat/messages/${messageId}`, { content }, {
      errorMessage: 'Failed to edit message',
    });
    return response.data;
  }

  // Delete a message
  static async deleteMessage(messageId: number): Promise<{ deletedAt: string }> {
    const response = await ApiService.delete(`/chat/messages/${messageId}`, {
      errorMessage: 'Failed to delete message',
    });
    return response.data;
  }

  // Mark message as read
  static async markMessageAsRead(messageId: number): Promise<void> {
    await ApiService.post(`/chat/messages/${messageId}/read`, undefined, {
      errorMessage: 'Failed to mark message as read',
    });
  }

  // Search users
  static async searchUsers(search?: string, limit?: number): Promise<ChatUser[]> {
    const response = await ApiService.get(
      '/chat/users',
      { search, limit },
      {
        errorMessage: 'Failed to search users',
      }
    );
    return response.data || [];
  }
}


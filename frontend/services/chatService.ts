import { apiUrl } from '@/lib/config';

// Types
export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: string;
    profileImage: string | null;
    specialty?: string | null;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
  title: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: {
    id: string;
    model: string;
    name: string;
  };
  content: string;
  attachments: {
    filename: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    uploadDate: string;
  }[];
  readBy: {
    user: string;
    model: string;
    readAt: string;
  }[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

// Get all conversations for a user
export const getConversations = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Conversation>> => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${userId}?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    success: data.success,
    data: data.conversations,
    pagination: data.pagination,
  };
};

// Get messages for a conversation
export const getMessages = async (
  conversationId: string,
  userId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ChatMessage>> => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${conversationId}/messages?userId=${userId}&page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    success: data.success,
    data: data.messages,
    pagination: data.pagination,
  };
};

// Create a new conversation
export const createConversation = async (
  userId: string,
  participants: { userId: string; role: string }[],
  title?: string
) => {
  const response = await fetch(`${apiUrl}/api/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      participants,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  return await response.json();
};

// Send a message to a conversation
export const sendMessage = async (
  conversationId: string,
  userId: string,
  content: string,
  attachments?: any[]
) => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        content,
        attachments,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return await response.json();
};

// Mark messages as read
export const markAsRead = async (
  conversationId: string,
  userId: string
) => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${conversationId}/read`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark messages as read: ${response.statusText}`);
  }

  return await response.json();
};

// Delete/Archive a conversation
export const deleteConversation = async (
  conversationId: string,
  userId: string
) => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${conversationId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }

  return await response.json();
}; 
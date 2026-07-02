export interface MentorConversationMessage {
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
  role: string;
}

export interface MentorMemory {
  category: string;
  confidence: number;
  content: string;
  id: string;
  importance: number;
  title: string;
}

export interface MentorSeedData {
  conversationId: string | null;
  mentorId: string;
  userId: string;
}

export interface MentorApiError {
  error?: string;
  errors?: Record<string, string>;
}

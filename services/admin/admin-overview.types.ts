export interface AdminOverviewTotals {
  conversations: number;
  feedback: number;
  messages: number;
  users: number;
}

export interface AdminRecentUser {
  conversationCount: number;
  createdAt: string;
  email: string;
  feedbackCount: number;
  lastActivityAt: string;
  messageCount: number;
}

export interface AdminRecentConversation {
  createdAt: string;
  email: string;
  mentorName: string;
  messageCount: number;
  updatedAt: string;
}

export interface AdminFeedbackSummary {
  byCategory: Array<{ count: number; label: string }>;
  byRating: Array<{ count: number; label: string }>;
  recent: Array<{
    category: string;
    createdAt: string;
    pagePath: string | null;
    rating: string;
  }>;
}

export interface AdminOverview {
  feedbackSummary: AdminFeedbackSummary;
  recentConversations: AdminRecentConversation[];
  recentUsers: AdminRecentUser[];
  totals: AdminOverviewTotals;
}

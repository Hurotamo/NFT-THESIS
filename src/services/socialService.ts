const API_BASE_URL = 'http://localhost:4000/api';

// User Profile Services
export const userProfileService = {
  // Create or update user profile
  async updateProfile(profileData: {
    wallet: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    socialLinks?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  // Get user profile
  async getProfile(wallet: string) {
    const response = await fetch(`${API_BASE_URL}/users/profile/${wallet}`);
    return response.json();
  },

  // Get user's social feed
  async getFeed(wallet: string) {
    const response = await fetch(`${API_BASE_URL}/users/feed/${wallet}`);
    return response.json();
  },

  // Follow/unfollow user
  async followUser(data: { follower: string; following: string; action: 'follow' | 'unfollow' }) {
    const response = await fetch(`${API_BASE_URL}/users/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Gallery Services
export const galleryService = {
  // Create gallery
  async createGallery(galleryData: {
    userId: string;
    name: string;
    description?: string;
    nftIds?: string[];
    isPublic?: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/galleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(galleryData),
    });
    return response.json();
  },

  // Get user's galleries
  async getUserGalleries(userId: string) {
    const response = await fetch(`${API_BASE_URL}/galleries/user/${userId}`);
    return response.json();
  },

  // Get public galleries
  async getPublicGalleries() {
    const response = await fetch(`${API_BASE_URL}/galleries/public`);
    return response.json();
  },

  // Update gallery
  async updateGallery(id: string, updateData: {
    name?: string;
    description?: string;
    nftIds?: string[];
    isPublic?: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/galleries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return response.json();
  },
};

// Comment Services
export const commentService = {
  // Add comment
  async addComment(commentData: {
    nftId: string;
    userId: string;
    text: string;
    parentId?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });
    return response.json();
  },

  // Get comments for NFT
  async getComments(nftId: string) {
    const response = await fetch(`${API_BASE_URL}/comments/nft/${nftId}`);
    return response.json();
  },

  // Like/unlike comment
  async likeComment(data: { commentId: string; userId: string; action: 'like' | 'unlike' }) {
    const response = await fetch(`${API_BASE_URL}/comments/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Collaboration Services
export const collaborationService = {
  // Create collaboration
  async createCollaboration(collabData: {
    nftId: string;
    collaborators: string[];
    roles?: string[];
    status?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/collaborations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collabData),
    });
    return response.json();
  },

  // Get collaborations for NFT
  async getCollaborations(nftId: string) {
    const response = await fetch(`${API_BASE_URL}/collaborations/nft/${nftId}`);
    return response.json();
  },

  // Update collaboration status
  async updateCollaborationStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/collaborations/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
};

// Forum Services
export const forumService = {
  // Create forum thread
  async createThread(threadData: {
    title: string;
    content: string;
    author: string;
    tags?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/forum/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(threadData),
    });
    return response.json();
  },

  // Get forum threads
  async getThreads(params?: { page?: number; limit?: number; tag?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.tag) searchParams.append('tag', params.tag);

    const response = await fetch(`${API_BASE_URL}/forum/threads?${searchParams}`);
    return response.json();
  },

  // Get single thread with replies
  async getThread(id: string) {
    const response = await fetch(`${API_BASE_URL}/forum/threads/${id}`);
    return response.json();
  },

  // Add reply to thread
  async addReply(threadId: string, replyData: { content: string; author: string }) {
    const response = await fetch(`${API_BASE_URL}/forum/threads/${threadId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyData),
    });
    return response.json();
  },
};

interface Comment {
  id: number;
  user: string;
  text: string;
  parentCommentId: number | null;
  replies?: Comment[];
}

interface AddCommentParams {
  user: string;
  text: string;
  parentCommentId?: number | null;
}

// Mock threaded comments data
const comments: Comment[] = [
  { id: 1, user: 'Alice', text: 'This is a great project!', parentCommentId: null },
  { id: 2, user: 'Bob', text: 'I agree with Alice!', parentCommentId: 1 },
  { id: 3, user: 'Carol', text: 'How can I contribute?', parentCommentId: null },
  { id: 4, user: 'Dave', text: 'Replying to Carol', parentCommentId: 3 },
];

export function getThreadedComments(): Comment[] {
  function buildThread(comments: Comment[], parentId: number | null = null): Comment[] {
    return comments
      .filter((c: Comment) => c.parentCommentId === parentId)
      .map((c: Comment) => ({ ...c, replies: buildThread(comments, c.id) }));
  }
  return buildThread(comments);
}

export function addComment({ user, text, parentCommentId = null }: AddCommentParams): Comment {
  const newComment: Comment = {
    id: comments.length + 1,
    user,
    text,
    parentCommentId,
  };
  comments.push(newComment);
  return newComment;
} 
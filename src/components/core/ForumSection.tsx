import React, { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../cards/Card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { forumService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';
import { MessageSquare, ArrowLeft, Clock, Eye, MessageCircle } from 'lucide-react';
import { CommentSection } from './CommentSection';

interface Thread {
  _id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: Date;
  replies: number;
  views: number;
  upvotes: number;
  downvotes: number;
}

interface Reply {
  _id: string;
  content: string;
  author: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
}

interface ForumSectionProps {
  currentUser: string;
}

// Mock threaded comments
const comments = [
  { id: 1, user: 'Alice', text: 'This is a great project!', parentCommentId: null },
  { id: 2, user: 'Bob', text: 'I agree with Alice!', parentCommentId: 1 },
  { id: 3, user: 'Carol', text: 'How can I contribute?', parentCommentId: null },
  { id: 4, user: 'Dave', text: 'Replying to Carol', parentCommentId: 3 },
];

// Helper to build nested structure
type CommentType = { id: number; user: string; text: string; parentCommentId: number | null; replies?: CommentType[] };
function buildThread(comments: CommentType[], parentId: number | null = null): CommentType[] {
  return comments
    .filter((c: CommentType) => c.parentCommentId === parentId)
    .map((c: CommentType) => ({ ...c, replies: buildThread(comments, c.id) }));
}

const threadedComments = buildThread(comments);

export const ForumSection: React.FC<ForumSectionProps> = ({ currentUser }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadReplies, setThreadReplies] = useState<Reply[]>([]);
  const [newThread, setNewThread] = useState({ title: '', content: '', tags: '' });
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const result = await forumService.getThreads();
      if (result.threads) {
        setThreads(result.threads);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const tags = newThread.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const result = await forumService.createThread({
        title: newThread.title.trim(),
        content: newThread.content.trim(),
        author: currentUser,
        tags
      });

      if (result._id) {
        toast({
          title: "Thread Created",
          description: "Your thread has been posted successfully.",
        });
        setNewThread({ title: '', content: '', tags: '' });
        setIsCreatingThread(false);
        await loadThreads();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create thread.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openThread = async (thread: Thread) => {
    try {
      const result = await forumService.getThread(thread._id);
      if (result) {
        setSelectedThread(result);
        setThreadReplies(result.replies || []);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;

    setIsLoading(true);
    try {
      const result = await forumService.addReply(selectedThread._id, {
        content: replyText.trim(),
        author: currentUser
      });

      if (result._id) {
        toast({
          title: "Reply Posted",
          description: "Your reply has been posted successfully.",
        });
        setReplyText('');
        await openThread(selectedThread);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to post reply.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  const getUserInitials = (userId: string) => {
    return userId.slice(0, 2).toUpperCase();
  };

  if (selectedThread) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedThread(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Forum
          </Button>
          <h2 className="text-2xl font-bold">{selectedThread.title}</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>{getUserInitials(selectedThread.author)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedThread.author}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(selectedThread.createdAt)}</span>
                    <Eye className="h-3 w-3" />
                    <span>{selectedThread.views} views</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                {selectedThread.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{selectedThread.content}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Replies ({threadReplies.length})</h3>
          
          {threadReplies.map((reply) => (
            <Card key={reply._id}>
              <CardContent className="pt-4">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>{getUserInitials(reply.author)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{reply.author}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <h4 className="font-medium">Add Reply</h4>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={handleReply} 
                  disabled={isLoading || !replyText.trim()}
                >
                  {isLoading ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2 py-8 md:px-8 bg-gradient-to-br from-blue-50/60 via-white/60 to-purple-50/60 dark:from-gray-900/80 dark:via-gray-950/60 dark:to-blue-900/60 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow font-sans">Community Forum</h2>
        <Button onClick={() => setIsCreatingThread(!isCreatingThread)} variant="outline" className="rounded-full px-5 py-2 font-semibold border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
          {isCreatingThread ? 'Cancel' : 'New Thread'}
        </Button>
      </div>

      {isCreatingThread && (
        <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 border border-blue-200/40 dark:border-blue-900/40 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-500">Create New Thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newThread.title}
                onChange={(e) => setNewThread(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter thread title"
                className="rounded-lg border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={newThread.content}
                onChange={(e) => setNewThread(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your thread content..."
                rows={4}
                className="rounded-lg border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={newThread.tags}
                onChange={(e) => setNewThread(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="research, blockchain, nft"
                className="rounded-lg border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="flex space-x-2 justify-end">
              <Button onClick={handleCreateThread} disabled={isLoading} className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all">
                {isLoading ? 'Creating...' : 'Create Thread'}
              </Button>
              <Button 
                onClick={() => setIsCreatingThread(false)} 
                variant="outline"
                className="rounded-full px-6 py-2 font-semibold border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {threads.map((thread) => (
          <Card 
            key={thread._id} 
            className="cursor-pointer hover:shadow-2xl transition-shadow rounded-xl border border-blue-200/40 dark:border-blue-900/40 bg-gradient-to-br from-white/80 to-blue-100/60 dark:from-gray-900/80 dark:to-blue-900/40 group overflow-hidden"
            onClick={() => openThread(thread)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback>{getUserInitials(thread.author)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors truncate">
                      {thread.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{thread.author}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(thread.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{thread.replies} replies</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{thread.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {thread.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2">
                {thread.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {threads.length === 0 && !isCreatingThread && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 border-0 shadow-none">
          <CardContent className="text-center py-12 flex flex-col items-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No threads yet</h3>
            <p className="text-gray-500 mb-4">Start the first discussion and engage with the community!</p>
            <Button onClick={() => setIsCreatingThread(true)} className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all">Create Thread</Button>
          </CardContent>
        </Card>
      )}

      <section className="my-8">
        <h2 className="text-2xl font-bold mb-4">Forum</h2>
        <CommentSection nftId={"dummy-nft-id"} currentUserId={currentUser} />
      </section>
    </div>
  );
}; 
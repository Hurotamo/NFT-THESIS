import React, { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../cards/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { commentService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';
import { Heart, MessageCircle, Reply } from 'lucide-react';

interface Comment {
  _id: string;
  nftId: string;
  userId: string;
  text: string;
  parentId?: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
  replies?: Comment[];
  user?: {
    username?: string;
    avatarUrl?: string;
  };
}

interface CommentSectionProps {
  nftId: string;
  currentUserId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  nftId,
  currentUserId
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [nftId]);

  const loadComments = async () => {
    try {
      const commentsData = await commentService.getComments(nftId);
      if (Array.isArray(commentsData)) {
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await commentService.addComment({
        nftId,
        userId: currentUserId,
        text: newComment.trim()
      });
      
      if (result._id) {
        setNewComment('');
        await loadComments();
        toast({
          title: "Comment Added",
          description: "Your comment has been posted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await commentService.addComment({
        nftId,
        userId: currentUserId,
        text: replyText.trim(),
        parentId
      });
      
      if (result._id) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
        toast({
          title: "Reply Added",
          description: "Your reply has been posted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add reply.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      const result = await commentService.likeComment({
        commentId,
        userId: currentUserId,
        action: isLiked ? 'unlike' : 'like'
      });
      
      if (result.success) {
        await loadComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      
      {/* Add Comment */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddComment} 
                disabled={isLoading || !newComment.trim()}
                size="sm"
              >
                {isLoading ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment._id}>
            <CardContent className="pt-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatarUrl} />
                  <AvatarFallback>{getUserInitials(comment.userId)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {comment.user?.username || `User ${comment.userId.slice(0, 6)}...`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700">{comment.text}</p>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeComment(comment._id, comment.likedBy.includes(currentUserId))}
                      className={`flex items-center space-x-1 text-xs ${
                        comment.likedBy.includes(currentUserId) 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={14} fill={comment.likedBy.includes(currentUserId) ? 'currentColor' : 'none'} />
                      <span>{comment.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500"
                    >
                      <Reply size={14} />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAddReply(comment._id)} 
                          disabled={isLoading || !replyText.trim()}
                          size="sm"
                        >
                          {isLoading ? 'Posting...' : 'Post Reply'}
                        </Button>
                        <Button 
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.user?.avatarUrl} />
                            <AvatarFallback>{getUserInitials(reply.userId)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-xs">
                                {reply.user?.username || `User ${reply.userId.slice(0, 6)}...`}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-700">{reply.text}</p>
                            
                            <button
                              onClick={() => handleLikeComment(reply._id, reply.likedBy.includes(currentUserId))}
                              className={`flex items-center space-x-1 text-xs ${
                                reply.likedBy.includes(currentUserId) 
                                  ? 'text-red-500' 
                                  : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <Heart size={12} fill={reply.likedBy.includes(currentUserId) ? 'currentColor' : 'none'} />
                              <span>{reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
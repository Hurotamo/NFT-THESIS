import React, { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader } from '../cards/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { userProfileService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';
import { UserPlus, Users, Activity, Heart, MessageCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface Activity {
  _id: string;
  wallet: string;
  type: 'nft_minted' | 'gallery_created' | 'comment_added' | 'collaboration_joined';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    nftId?: string;
    galleryId?: string;
    commentId?: string;
    collaborationId?: string;
  };
}

interface User {
  wallet: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

interface SocialFeedProps {
  currentUser: string;
  timelineMode?: boolean;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ currentUser, timelineMode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, User>>({});
  const [newFollowAddress, setNewFollowAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFeed();
  }, [currentUser]);

  const loadFeed = async () => {
    try {
      // Load user's feed
      const feedData = await userProfileService.getFeed(currentUser);
      if (Array.isArray(feedData)) {
        setActivities(feedData);
      }

      // Load user's profile to get followed users
      const userProfile = await userProfileService.getProfile(currentUser);
      if (userProfile && userProfile.following) {
        setFollowedUsers(userProfile.following);
        
        // Load profiles for followed users
        const profiles: Record<string, User> = {};
        for (const wallet of userProfile.following) {
          try {
            const profile = await userProfileService.getProfile(wallet);
            if (profile && !profile.error) {
              profiles[wallet] = profile;
            }
          } catch (error) {
            console.error(`Error loading profile for ${wallet}:`, error);
          }
        }
        setUserProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const handleFollow = async () => {
    if (!newFollowAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address to follow.",
        variant: "destructive",
      });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newFollowAddress.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid wallet address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await userProfileService.followUser({
        follower: currentUser,
        following: newFollowAddress.trim(),
        action: 'follow'
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "You are now following this user.",
        });
        setNewFollowAddress('');
        await loadFeed();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to follow user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (wallet: string) => {
    try {
      const result = await userProfileService.followUser({
        follower: currentUser,
        following: wallet,
        action: 'unfollow'
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "You have unfollowed this user.",
        });
        await loadFeed();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfollow user.",
        variant: "destructive",
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'nft_minted':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'gallery_created':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'collaboration_joined':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'nft_minted':
        return <Badge variant="default" className="bg-green-100 text-green-800">NFT Minted</Badge>;
      case 'gallery_created':
        return <Badge variant="secondary">Gallery Created</Badge>;
      case 'comment_added':
        return <Badge variant="outline">Comment</Badge>;
      case 'collaboration_joined':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Collaboration</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
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

  const getUserDisplayName = (wallet: string) => {
    const profile = userProfiles[wallet];
    return profile?.username || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  if (timelineMode) {
    return (
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center text-gray-400">No recent activity yet.</div>
        ) : (
          activities.map((activity, idx) => (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-md flex items-start gap-4"
            >
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white shadow-lg">
                  {getActivityIcon(activity.type)}
                </span>
                {idx < activities.length - 1 && (
                  <span className="w-1 h-8 bg-gradient-to-b from-blue-400/60 via-purple-400/60 to-blue-400/0 rounded-full mt-1" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>{activity.title}</span>
                  {getActivityBadge(activity.type)}
                </div>
                <div className="text-gray-300 text-sm mb-1">{activity.description}</div>
                <div className="text-xs text-gray-500">{formatDate(activity.timestamp)}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Social Feed</h2>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            Following {followedUsers.length} users
          </span>
        </div>
      </div>

      {/* Follow New User */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">Follow New User</h3>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={newFollowAddress}
              onChange={(e) => setNewFollowAddress(e.target.value)}
              placeholder="Enter wallet address to follow"
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleFollow} 
              disabled={isLoading || !newFollowAddress.trim()}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Follow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Followed Users */}
      {followedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-medium">Following</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followedUsers.map((wallet) => {
                const profile = userProfiles[wallet];
                return (
                  <div key={wallet} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatarUrl} />
                      <AvatarFallback>{getUserInitials(wallet)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getUserDisplayName(wallet)}
                      </p>
                      {profile?.bio && (
                        <p className="text-xs text-gray-500 truncate">{profile.bio}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnfollow(wallet)}
                    >
                      Unfollow
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={userProfiles[activity.wallet]?.avatarUrl} />
                        <AvatarFallback>{getUserInitials(activity.wallet)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {getUserDisplayName(activity.wallet)}
                      </span>
                      {getActivityBadge(activity.type)}
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(activity.timestamp)}</span>
                      {activity.metadata?.nftId && (
                        <span>NFT: {activity.metadata.nftId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {followedUsers.length === 0 
                  ? "Follow some users to see their activities here!"
                  : "No recent activity from followed users."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SocialFeed; 
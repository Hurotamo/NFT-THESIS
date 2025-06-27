import React from 'react';
import { ForumSection } from '../components/core/ForumSection';
import { Card, CardContent, CardHeader, CardTitle } from '../components/cards/Card';
import { useWeb3 } from '../contexts/Web3Context';
import { MessageSquare, Users, TrendingUp } from 'lucide-react';

export const Forum: React.FC = () => {
  const { currentAccount } = useWeb3();

  if (!currentAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500">
              Please connect your wallet to participate in the community forum.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <p className="text-gray-600 mt-2">
          Join discussions about research, NFTs, blockchain technology, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Forum Content */}
        <div className="lg:col-span-3">
          <ForumSection currentUser={currentAccount} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Active Users</span>
                </div>
                <span className="font-semibold">1,234</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Threads</span>
                </div>
                <span className="font-semibold">567</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Today's Posts</span>
                </div>
                <span className="font-semibold">89</span>
              </div>
            </CardContent>
          </Card>

          {/* Popular Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm">#research</span>
                  <span className="text-xs text-gray-500">234 posts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm">#blockchain</span>
                  <span className="text-xs text-gray-500">189 posts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm">#nft</span>
                  <span className="text-xs text-gray-500">156 posts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm">#defi</span>
                  <span className="text-xs text-gray-500">98 posts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm">#thesis</span>
                  <span className="text-xs text-gray-500">76 posts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forum Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forum Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Be respectful and constructive in discussions</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Share relevant research and insights</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use appropriate tags for better organization</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>No spam or promotional content</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Report inappropriate content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 
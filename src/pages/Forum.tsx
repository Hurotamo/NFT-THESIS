import React from 'react';
import { ForumSection } from '../components/core/ForumSection';
import { useWeb3 } from '../contexts/Web3Context';
import { MessageSquare, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Forum: React.FC = () => {
  const { currentAccount } = useWeb3();

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-black/90 rounded-3xl p-12 border-2 border-blue-500/40 text-center max-w-md mx-auto shadow-2xl"
        >
          <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-4">Connect Your Wallet</h2>
          <p className="text-blue-200 mb-6">Please connect your wallet to participate in the community forum.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-black via-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-10 text-center">
          <div className="flex flex-col items-center mb-4">
            <MessageSquare className="w-14 h-14 text-blue-400 mb-2" />
            <h1 className="text-4xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-2">Community Forum</h1>
          </div>
          <p className="text-blue-200 text-lg">Join discussions about research, NFTs, blockchain technology, and more.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Forum Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-2xl bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-black/90 rounded-3xl p-8 border-2 border-blue-500/40 shadow-2xl">
              <ForumSection currentUser={currentAccount} />
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Community Stats */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-black/30 rounded-2xl p-6 border border-blue-400/20 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">Community Stats</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-2xl font-extrabold text-blue-500">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Threads</span>
                  <span className="text-2xl font-extrabold text-purple-500">567</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Posts</span>
                  <span className="text-2xl font-extrabold text-pink-500">89</span>
                </div>
              </div>
            </div>
            {/* Popular Topics */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-black/30 rounded-2xl p-6 border border-blue-400/20 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">Popular Topics</span>
              </div>
              <div className="space-y-2">
                {[
                  { tag: '#research', count: 234 },
                  { tag: '#blockchain', count: 189 },
                  { tag: '#nft', count: 156 },
                  { tag: '#defi', count: 98 },
                  { tag: '#thesis', count: 76 },
                ].map((topic) => (
                  <div key={topic.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-purple-100/60 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40 cursor-pointer transition-all">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-200">{topic.tag}</span>
                    <span className="text-xs text-gray-500">{topic.count} posts</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Forum Guidelines */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-black/30 rounded-2xl p-6 border border-blue-400/20 shadow-lg">
              <div className="mb-4 text-lg font-bold text-blue-700 dark:text-blue-300">Forum Guidelines</div>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {[
                  'Be respectful and constructive in discussions',
                  'Share relevant research and insights',
                  'Use appropriate tags for better organization',
                  'No spam or promotional content',
                  'Report inappropriate content',
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 
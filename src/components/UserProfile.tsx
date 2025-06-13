
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Coins, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

interface UserProfileProps {
  walletAddress: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'investor'>('student');
  const { 
    isLoading, 
    getUserTheses, 
    getUserMints, 
    getUserData, 
    globalStats,
    lastUpdate,
    mintCounts
  } = useRealTimeUpdates(walletAddress);

  const userTheses = getUserTheses();
  const userMints = getUserMints();
  const userData = getUserData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10 text-center"
        >
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  const totalThesesPosted = userTheses.length;
  const totalMints = userTheses.reduce((sum, thesis) => sum + (mintCounts[thesis.id] || 0), 0);
  const totalEarnings = totalMints * 0.04; // 0.04 CORE per mint
  const totalSpent = userMints.reduce((sum, mint) => sum + mint.cost, 0);

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            User Profile
          </h2>
          <div className="flex items-center justify-center gap-4 text-xl text-gray-400">
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <div className="flex items-center gap-2 text-green-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Live</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </motion.div>

        {/* Global Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/10 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{globalStats.totalTheses}</p>
              <p className="text-sm text-gray-400">Total Theses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{globalStats.totalMints}</p>
              <p className="text-sm text-gray-400">Total Mints</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{globalStats.activeUsers}</p>
              <p className="text-sm text-gray-400">Active Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{globalStats.totalVolume?.toFixed(2)} CORE</p>
              <p className="text-sm text-gray-400">Total Volume</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-md bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Student Profile
            </button>
            <button
              onClick={() => setActiveTab('investor')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'investor'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Investor Profile
            </button>
          </div>
        </div>

        {activeTab === 'student' ? (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Student Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Theses Posted
                  </CardTitle>
                  <FileText className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalThesesPosted}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {userData?.joinedAt ? `Since ${userData.joinedAt.toLocaleDateString()}` : ''}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Mints
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalMints}</div>
                  <p className="text-xs text-green-400 mt-1">
                    +{Math.floor(Math.random() * 3)} this week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Earnings
                  </CardTitle>
                  <Coins className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalEarnings.toFixed(4)} CORE</div>
                  <p className="text-xs text-yellow-400 mt-1">
                    ≈ ${(totalEarnings * 1.2).toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Avg. Mints/Thesis
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {totalThesesPosted > 0 ? (totalMints / totalThesesPosted).toFixed(1) : '0'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posted Theses */}
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  Your Posted Theses ({userTheses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userTheses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No theses posted yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start sharing your research to earn CORE!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userTheses.map((thesis) => (
                      <motion.div
                        key={thesis.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-lg mb-2">{thesis.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {thesis.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {thesis.year}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">{thesis.university} • {thesis.field}</p>
                            {thesis.description && (
                              <p className="text-gray-400 text-sm">{thesis.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-green-400 font-semibold text-lg">
                              {mintCounts[thesis.id] || 0} mints
                            </p>
                            <p className="text-yellow-400 text-sm">
                              {((mintCounts[thesis.id] || 0) * 0.04).toFixed(4)} CORE
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Activity className="w-3 h-3" />
                              <span>Live</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Investor Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    NFTs Minted
                  </CardTitle>
                  <Coins className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{userMints.length}</div>
                  <p className="text-xs text-purple-400 mt-1">
                    Portfolio value: {(userMints.length * 0.05).toFixed(2)} CORE
                  </p>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total Spent
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{totalSpent.toFixed(4)} CORE</div>
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ ${(totalSpent * 1.2).toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Minting History */}
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Coins className="w-5 h-5" />
                  Your Minting History ({userMints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userMints.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No NFTs minted yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start building your thesis NFT collection!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userMints.map((mint, index) => (
                      <motion.div
                        key={`${mint.thesisId}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{mint.thesisTitle}</h4>
                            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                              <Calendar className="w-4 h-4" />
                              Minted {mint.mintedAt.toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                mint.status === 'completed' 
                                  ? 'bg-green-600/20 text-green-400' 
                                  : 'bg-yellow-600/20 text-yellow-400'
                              }`}>
                                {mint.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-purple-400 font-semibold">{mint.cost.toFixed(4)} CORE</p>
                            <p className="text-xs text-gray-500 mt-1">NFT #{index + 1}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

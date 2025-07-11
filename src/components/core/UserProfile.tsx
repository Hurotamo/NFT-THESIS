import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Coins, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/cards/Card";
import { useContracts } from '@/hooks/useContracts';
import { MintedNFT, NFTContractService } from '@/services/nftContractService';
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { SocialFeed as SocialFeedComponent } from './SocialFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  walletAddress: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'investor'>('student');
  const [userNFTs, setUserNFTs] = useState<MintedNFT[]>([]);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { getTotalStaked } = useContracts();

  const mockReferralLink = 'https://nft-thesis.app/referral/abc123';
  const mockReferralStats = { invites: 5, rewards: 2 };

  // Poll for real-time profile data
  useEffect(() => {
    const nftService = NFTContractService.getInstance();
    let isMounted = true;
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const nfts = await nftService.getUserMintedNFTs();
        const staked = await getTotalStaked();
        if (isMounted) {
          setUserNFTs(nfts);
          setTotalStaked(staked);
          setLastUpdate(new Date());
        }
      } catch (e) {
        // handle error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchProfileData();
    const interval = setInterval(fetchProfileData, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getTotalStaked, walletAddress]);

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

  // Example stats (replace with real calculations as needed)
  const totalThesisPosted = userNFTs.length;
  const totalMints = userNFTs.length;
  const totalEarnings = totalMints * 0.04; // 0.04 CORE per mint
  const totalSpent = 0; // No userMints, so totalSpent is 0

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Gradient Banner */}
        <div className="w-full h-32 md:h-40 rounded-2xl mb-[-48px] md:mb-[-64px] bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-blue-700/80 shadow-lg" />
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-black/70 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl text-center mb-8 mt-[-48px] md:mt-[-64px]"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg">
              <AvatarImage src={''} alt="User avatar" />
              <AvatarFallback>{walletAddress.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
            User Profile
          </h2>
          <div className="flex items-center justify-center gap-4 text-lg text-gray-400 mb-2">
            <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <div className="flex items-center gap-2 text-green-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Live</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </motion.div>
        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/10 mb-8 shadow-lg"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalThesisPosted}</p>
              <p className="text-sm text-gray-400">Total Theses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{totalMints}</p>
              <p className="text-sm text-gray-400">Total Mints</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{totalStaked}</p>
              <p className="text-sm text-gray-400">Staked tCORE2</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{totalEarnings.toFixed(2)} CORE</p>
              <p className="text-sm text-gray-400">Total Earnings</p>
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
        {/* Add this section near the top of the profile */}
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Referral Program</h3>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="referral-link" className="sr-only">Referral Link</label>
            <input
              id="referral-link"
              type="text"
              value={mockReferralLink}
              readOnly
              className="border rounded px-2 py-1 w-full max-w-xs text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(mockReferralLink)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-gray-600">Invites: {mockReferralStats.invites} | Rewards: {mockReferralStats.rewards}</div>
        </div>
        {/* Wrap conditional rendering in a fragment to ensure valid JSX */}
        <>
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
                    <div className="text-2xl font-bold text-white">{totalThesisPosted}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {/* Add joined date if available */}
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
                      {/* Add weekly stats if available */}
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
                      {totalThesisPosted > 0 ? (totalMints / totalThesisPosted).toFixed(1) : '0'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Posted Theses */}
              <Card className="backdrop-blur-md bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    Your Posted Theses ({userNFTs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No theses posted yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start sharing your research to earn CORE!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {userNFTs.map((nft, idx) => (
                        <motion.div
                          key={nft.tokenId || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold text-lg mb-2">{nft.metadata.title || nft.tokenId}
                                {nft.metadata.ipfsHash && (
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${nft.metadata.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline ml-2 text-xs"
                                  >
                                    View on IPFS
                                  </a>
                                )}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {nft.metadata.author || ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {nft.metadata.year || ''}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{nft.metadata.university || ''} • {nft.metadata.field || ''}</p>
                              {nft.metadata.description && (
                                <p className="text-gray-400 text-sm">{nft.metadata.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-green-400 font-semibold text-lg">
                                {/* Add mint count if available */}
                              </p>
                              <p className="text-yellow-400 text-sm">
                                {/* Add earnings if available */}
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
                    <div className="text-2xl font-bold text-white">{userNFTs.length}</div>
                    <p className="text-xs text-purple-400 mt-1">
                      Portfolio value: {(userNFTs.length * 0.05).toFixed(2)} CORE
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
                    Your Minting History ({userNFTs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No NFTs minted yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start building your thesis NFT collection!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {userNFTs.map((mint, index) => (
                        <motion.div
                          key={mint.tokenId || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold">{mint.metadata.title || mint.tokenId}
                                {mint.metadata.ipfsHash && (
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${mint.metadata.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline ml-2 text-xs"
                                  >
                                    View on IPFS
                                  </a>
                                )}
                              </h4>
                              <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4" />
                                {/* Minted date if available */}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs bg-green-600/20 text-green-400`}>
                                  {/* Status if available */}
                                  completed
                                </span>
                              </div>
                              {mint.isBlurred ? (
                                <div className="bg-blue-900/20 border border-blue-400/30 rounded p-4 text-center mt-3">
                                  <p className="text-blue-300 italic mb-2">Blurred content</p>
                                  <span className="text-xs text-blue-400">Content will unlock after auction completion</span>
                                </div>
                              ) : (
                                <div className="text-green-400 text-sm mt-3">Full content unlocked! <a href={`https://ipfs.io/ipfs/${mint.metadata.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="underline">View File</a></div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-purple-400 font-semibold">{mint.cost ? mint.cost.toFixed(4) : '0.0000'} CORE</p>
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
        </>
        {/* User Activity Feed as Timeline */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
            Recent Activity
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400/60 via-purple-400/60 to-blue-400/0 rounded-full" />
            <div className="pl-16 space-y-6">
              <SocialFeedComponent currentUser={walletAddress} timelineMode />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Coins, CheckCircle, AlertCircle, User, Calendar, BookOpen, Activity, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { useContracts } from '../hooks/useContracts';
import { NFTMetadata } from '../services/nftContractService';

interface EnhancedMintingSectionProps {
  walletAddress: string;
}

const EnhancedMintingSection: React.FC<EnhancedMintingSectionProps> = ({ walletAddress }) => {
  const [selectedThesis, setSelectedThesis] = useState<{
    id: string;
    title: string;
    author: string;
    university: string;
    year: number;
    field: string;
    description: string;
    ipfsHash?: string;
    tags?: string[];
  } | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  const { mintNFT, getUserNFTs, getTotalStaked, hasDiscountEligibility } = useContracts();
  
  const { 
    theses, 
    mintCounts, 
    isLoading, 
    refreshData, 
    lastUpdate 
  } = useRealTimeUpdates();

  const [userMintedNFTs, setUserMintedNFTs] = useState<Array<{ thesisId: string }>>([]);
  const [totalStaked, setTotalStaked] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (walletAddress) {
        try {
          const [staked, discount, nfts] = await Promise.all([
            getTotalStaked(),
            hasDiscountEligibility(),
            getUserNFTs()
          ]);
          
          setTotalStaked(staked);
          setHasDiscount(discount);
          setUserMintedNFTs(nfts);
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
    };

    loadUserData();
  }, [walletAddress, getTotalStaked, hasDiscountEligibility, getUserNFTs]);

  const baseFee = 0.05; // 0.05 CORE per NFT
  const platformFeePercentage = 20; // 20% platform fee (matches contract)
  const discountRate = hasDiscount ? 0.2 : 0; // 20% discount for stakers
  const discountedFee = baseFee * (1 - discountRate);
  const platformFee = discountedFee * (platformFeePercentage / 100);
  const totalCost = discountedFee + platformFee;

  const handleThesisSelect = (thesis: {
    id: string;
    title: string;
    author: string;
    university: string;
    year: number;
    field: string;
    description: string;
    ipfsHash?: string;
    tags?: string[];
  }) => {
    setSelectedThesis(thesis);
    toast({
      title: "Thesis Selected",
      description: `Selected "${thesis.title}" for minting`,
    });
  };

  const canUserMintThesis = (thesisId: string): boolean => {
    // Check if user has already minted this thesis
    return !userMintedNFTs.some(nft => nft.thesisId === thesisId);
  };

  const handleMint = async () => {
    if (!selectedThesis) {
      toast({
        title: "No Thesis Selected",
        description: "Please select a thesis to mint",
        variant: "destructive",
      });
      return;
    }

    if (!canUserMintThesis(selectedThesis.id)) {
      toast({
        title: "Already Minted",
        description: "You can only mint 1 NFT per thesis per wallet",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);

    try {
      const metadata: NFTMetadata = {
        title: selectedThesis.title,
        author: selectedThesis.author,
        university: selectedThesis.university,
        year: selectedThesis.year,
        field: selectedThesis.field,
        description: selectedThesis.description,
        ipfsHash: selectedThesis.ipfsHash || 'mock_hash',
        tags: selectedThesis.tags || []
      };

      const mintedNFT = await mintNFT(selectedThesis.id, metadata, totalStaked);
      
      if (mintedNFT) {
        // Refresh data
        refreshData();
        const updatedNFTs = await getUserNFTs();
        setUserMintedNFTs(updatedNFTs);
        
        toast({
          title: "NFT Minted Successfully!",
          description: `NFT minted for "${selectedThesis.title}" at ${totalCost.toFixed(4)} CORE. NFT is blurred until auction completion.`,
        });
        
        setSelectedThesis(null);
      }
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-gray-300">Please connect your wallet to start minting NFTs.</p>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10 text-center"
        >
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading available theses...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Enhanced NFT Minting
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            Mint thesis NFTs with platform fees, staking discounts, and 1 NFT per wallet limit. NFTs are blurred until auction completion.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span>Live Market</span>
            </div>
            <span>•</span>
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </motion.div>

        {/* Enhanced Stats with Staking Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/10 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{theses.length}</p>
              <p className="text-sm text-gray-400">Available Theses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{userMintedNFTs.length}</p>
              <p className="text-sm text-gray-400">Your NFTs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalStaked.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Staked CORE</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{hasDiscount ? '20%' : '0%'}</p>
              <p className="text-sm text-gray-400">Discount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{totalCost.toFixed(4)}</p>
              <p className="text-sm text-gray-400">Mint Price</p>
            </div>
          </div>
        </motion.div>

        {/* Thesis Selection */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Available Theses */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Available Theses</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {theses.map((thesis: any) => (
                <motion.div
                  key={thesis.id}
                  whileHover={{ scale: 1.02 }}
                  className={`backdrop-blur-md rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                    selectedThesis?.id === thesis.id
                      ? 'bg-blue-600/20 border-blue-400/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  } ${!canUserMintThesis(thesis.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => canUserMintThesis(thesis.id) && handleThesisSelect(thesis)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{thesis.title}</h4>
                      <p className="text-sm text-gray-400 mb-2">{thesis.author}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {thesis.field}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {thesis.year}
                        </span>
                      </div>
                    </div>
                    {!canUserMintThesis(thesis.id) && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Minting Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Minting Panel</h3>
            
            {selectedThesis ? (
              <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4">{selectedThesis.title}</h4>
                
                {/* Fee Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Base Fee:</span>
                    <span className="text-white">{baseFee.toFixed(4)} CORE</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Staking Discount (20%):</span>
                      <span className="text-green-400">-{(baseFee * discountRate).toFixed(4)} CORE</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (20%):</span>
                    <span className="text-yellow-400">{platformFee.toFixed(4)} CORE</span>
                  </div>
                  <div className="border-t border-white/20 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-white">Total Cost:</span>
                      <span className="text-green-400">{totalCost.toFixed(4)} CORE</span>
                    </div>
                  </div>
                </div>

                {/* Mint Button */}
                <Button
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isMinting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Minting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Mint NFT
                    </div>
                  )}
                </Button>

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                  <div className="flex items-start gap-2 text-sm">
                    <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-400 font-medium">NFT will be blurred</p>
                      <p className="text-gray-400">Content becomes visible after auction completion</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Select a Thesis</h4>
                <p className="text-gray-400">Choose a thesis from the list to start minting</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* User's Minted NFTs */}
        {userMintedNFTs.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-white mb-6">Your Minted NFTs</h3>
            <div className="grid gap-4">
              {userMintedNFTs.map((nft, idx) => (
                <div key={nft.tokenId || idx} className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold text-lg mb-2">{nft.metadata.title || `NFT #${idx + 1}`}</h4>
                  {nft.isBlurred ? (
                    <div className="bg-blue-900/20 border border-blue-400/30 rounded p-4 text-center">
                      <p className="text-blue-300 italic mb-2">{nft.blurredContent}</p>
                      <span className="text-xs text-blue-400">Content will unlock after auction completion</span>
                    </div>
                  ) : (
                    <div className="text-green-400 text-sm">Full content unlocked! <a href={`https://ipfs.io/ipfs/${nft.metadata.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="underline">View File</a></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMintingSection;

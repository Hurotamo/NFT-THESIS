
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Coins, CheckCircle, AlertCircle, User, Calendar, BookOpen, Activity, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { NFTContractService } from '../services/nftContractService';
import { StakingService } from '../services/stakingService';

interface EnhancedMintingSectionProps {
  walletAddress: string;
}

const EnhancedMintingSection: React.FC<EnhancedMintingSectionProps> = ({ walletAddress }) => {
  const [selectedThesis, setSelectedThesis] = useState<any | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  
  const { 
    theses, 
    mintCounts, 
    isLoading, 
    refreshData, 
    lastUpdate 
  } = useRealTimeUpdates();

  const nftService = NFTContractService.getInstance();
  const stakingService = StakingService.getInstance();

  const [userMintedNFTs, setUserMintedNFTs] = useState<any[]>([]);
  const [totalStaked, setTotalStaked] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      const staked = stakingService.getTotalStaked(walletAddress);
      setTotalStaked(staked);
      setHasDiscount(stakingService.hasDiscountEligibility(walletAddress));
      setUserMintedNFTs(nftService.getUserMintedNFTs(walletAddress));
    }
  }, [walletAddress]);

  const baseFee = 0.05; // 0.05 CORE per NFT
  const platformFeePercentage = 5; // 5% platform fee
  const discountRate = hasDiscount ? stakingService.getDiscountPercentage(walletAddress) / 100 : 0;
  const finalFee = baseFee * (1 - discountRate);
  const platformFee = finalFee * (platformFeePercentage / 100);
  const authorRoyalty = finalFee * 0.1; // 10% to author

  const handleThesisSelect = (thesis: any) => {
    setSelectedThesis(thesis);
    
    // Set NFT config for this thesis
    nftService.setNFTConfig(thesis.id, {
      maxSupply: thesis.maxNFTs || 100,
      platformFeePercentage: 5,
      authorRoyaltyPercentage: 10,
      mintPrice: finalFee,
      isBlurred: true,
      introOnly: true
    });

    toast({
      title: "Thesis Selected",
      description: `Selected "${thesis.title}" for minting`,
    });
  };

  const canUserMintThesis = (thesisId: string): boolean => {
    return nftService.canUserMint(walletAddress, thesisId);
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
      const mintedNFT = await nftService.mintNFT(
        selectedThesis.id,
        walletAddress,
        {
          title: selectedThesis.title,
          author: selectedThesis.author,
          university: selectedThesis.university,
          year: selectedThesis.year,
          field: selectedThesis.field,
          description: selectedThesis.description,
          ipfsHash: selectedThesis.ipfsHash || 'mock_hash',
          tags: selectedThesis.tags || []
        },
        totalStaked
      );
      
      // Refresh data
      refreshData();
      setUserMintedNFTs(nftService.getUserMintedNFTs(walletAddress));
      
      toast({
        title: "NFT Minted Successfully!",
        description: `NFT minted for "${selectedThesis.title}" at ${finalFee.toFixed(4)} CORE. NFT is blurred until auction completion.`,
      });
      
      setSelectedThesis(null);
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
              <p className="text-2xl font-bold text-yellow-400">{finalFee.toFixed(4)} CORE</p>
              <p className="text-sm text-gray-400">Mint Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{hasDiscount ? `${stakingService.getDiscountPercentage(walletAddress)}%` : '0%'}</p>
              <p className="text-sm text-gray-400">Your Discount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalStaked.toFixed(0)}</p>
              <p className="text-sm text-gray-400">CORE Staked</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Theses with Enhanced Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              Available Theses ({theses.length})
            </h3>

            {theses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No theses available for minting yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {theses.map((thesis) => {
                  const mintCount = mintCounts[thesis.id] || 0;
                  const maxNFTs = thesis.maxNFTs || 100;
                  const userCanMint = canUserMintThesis(thesis.id);
                  const isSelected = selectedThesis?.id === thesis.id;
                  
                  return (
                    <motion.div
                      key={thesis.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => userCanMint && handleThesisSelect(thesis)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-400'
                          : userCanMint
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-gray-600/20 border-gray-400/20 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {/* NFT Supply Info */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                          {mintCount}/{maxNFTs} minted
                        </div>
                        {!userCanMint && (
                          <div className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Already minted
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-20">
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
                            <p className="text-gray-400 text-sm line-clamp-2">{thesis.description}</p>
                          )}
                        </div>
                        
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-blue-400 mt-4" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Enhanced Minting Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Coins className="w-8 h-8 text-purple-400" />
              Enhanced Minting
            </h3>

            <div className="space-y-6">
              {/* Staking Discount Status */}
              {hasDiscount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-600/20 border border-green-400/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-400 font-semibold">{stakingService.getDiscountPercentage(walletAddress)}% Discount Applied!</p>
                      <p className="text-sm text-green-300">
                        You've staked {totalStaked.toFixed(0)} CORE tokens
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Selected Thesis */}
              {selectedThesis ? (
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-white/20">
                  <h4 className="text-white font-bold text-lg mb-2">Selected Thesis</h4>
                  <p className="text-blue-300 font-semibold">{selectedThesis.title}</p>
                  <p className="text-gray-300 text-sm">by {selectedThesis.author}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <EyeOff className="w-3 h-3 text-yellow-400" />
                    <span>NFT will be blurred until auction completion</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-600/20 rounded-lg p-4 border border-gray-400/20">
                  <p className="text-gray-400 text-center">Select a thesis to mint</p>
                </div>
              )}

              {/* Fee Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Base minting fee:</span>
                  <span>{baseFee.toFixed(4)} CORE</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span>Staking discount ({stakingService.getDiscountPercentage(walletAddress)}%):</span>
                    <span>-{(baseFee * discountRate).toFixed(4)} CORE</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Platform fee (5%):</span>
                  <span>{platformFee.toFixed(4)} CORE</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Author royalty (10%):</span>
                  <span>{authorRoyalty.toFixed(4)} CORE</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total Cost:</span>
                    <span>{finalFee.toFixed(4)} CORE</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ ${(finalFee * 1.2).toFixed(2)} USD
                  </p>
                </div>
              </div>

              {/* Minting Rules */}
              <div className="bg-yellow-600/10 border border-yellow-400/30 rounded-lg p-4">
                <h5 className="text-yellow-400 font-semibold mb-2">Minting Rules</h5>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• 1 NFT per wallet per thesis</li>
                  <li>• NFTs are blurred until auction ends</li>
                  <li>• Only minters can participate in auctions</li>
                  <li>• Stake 100+ CORE for discounts</li>
                </ul>
              </div>

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={!selectedThesis || isMinting || !canUserMintThesis(selectedThesis?.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMinting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Minting NFT...
                  </div>
                ) : !selectedThesis ? (
                  'Select a Thesis to Mint'
                ) : !canUserMintThesis(selectedThesis.id) ? (
                  'Already Minted This Thesis'
                ) : (
                  'Mint NFT'
                )}
              </Button>

              {selectedThesis && canUserMintThesis(selectedThesis.id) && (
                <p className="text-xs text-gray-500 text-center">
                  You'll receive a blurred NFT certificate. It will be revealed when you win an auction.
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* User's Minted NFTs */}
        {userMintedNFTs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Coins className="w-8 h-8 text-green-400" />
              Your Minted NFTs ({userMintedNFTs.length})
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userMintedNFTs.map((nft, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    {nft.isBlurred ? <EyeOff className="w-4 h-4 text-yellow-400" /> : <Eye className="w-4 h-4 text-green-400" />}
                    <span className="text-sm text-gray-400">
                      {nft.isBlurred ? 'Blurred' : 'Revealed'} NFT
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-1">{nft.metadata.title}</h4>
                  <p className="text-gray-400 text-sm">Token ID: {nft.tokenId}</p>
                  <p className="text-gray-500 text-xs">Minted: {new Date(nft.mintedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMintingSection;

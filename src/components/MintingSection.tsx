import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Coins, CheckCircle, AlertCircle, User, Calendar, BookOpen, Activity, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

interface MintingSectionProps {
  walletAddress: string;
}

const MintingSection: React.FC<MintingSectionProps> = ({ walletAddress }) => {
  const [selectedThesis, setSelectedThesis] = useState<any | null>(null);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  
  const { 
    theses, 
    mintCounts, 
    isLoading, 
    refreshData, 
    dataManager,
    globalStats,
    lastUpdate 
  } = useRealTimeUpdates();

  const stakedAmount = 150; // Mock staked amount
  const hasDiscount = stakedAmount >= 100;
  const baseFee = 0.05; // 0.05 CORE per NFT
  const discountRate = 0.2; // 20%
  const finalFee = hasDiscount ? baseFee * (1 - discountRate) : baseFee;
  const totalCost = finalFee * mintQuantity;

  const handleThesisSelect = (thesis: any) => {
    setSelectedThesis(thesis);
    toast({
      title: "Thesis Selected",
      description: `Selected "${thesis.title}" for minting`,
    });
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

    setIsMinting(true);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Record mints using the data manager
      for (let i = 0; i < mintQuantity; i++) {
        const mintRecord = {
          id: `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          thesisId: selectedThesis.id,
          thesisTitle: selectedThesis.title,
          mintedAt: new Date(),
          cost: finalFee,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          status: 'completed' as const
        };
        
        dataManager.recordMint(walletAddress, mintRecord);
      }
      
      // Refresh data to show updates
      refreshData();
      
      toast({
        title: "NFT Minted Successfully!",
        description: `${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''} minted for "${selectedThesis.title}" at ${totalCost.toFixed(4)} CORE`,
      });
      
      // Reset selection
      setSelectedThesis(null);
      setMintQuantity(1);
    } catch (error) {
      toast({
        title: "Minting Failed",
        description: "Failed to mint NFT. Please try again.",
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
            Mint Thesis NFTs
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            Browse available theses posted by students and mint them as NFTs. Support academic research while building your digital asset portfolio.
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

        {/* Market Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/10 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{theses.length}</p>
              <p className="text-sm text-gray-400">Available Theses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{globalStats.totalMints}</p>
              <p className="text-sm text-gray-400">Total Mints</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{finalFee.toFixed(4)} CORE</p>
              <p className="text-sm text-gray-400">Current Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{hasDiscount ? '20%' : '0%'}</p>
              <p className="text-sm text-gray-400">Your Discount</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Theses */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              Available Theses ({theses.length})
              <div className="flex items-center gap-1 text-green-400 text-sm ml-auto">
                <Activity className="w-4 h-4" />
                <span>Live</span>
              </div>
            </h3>

            {theses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No theses available for minting yet.</p>
                <p className="text-gray-500 text-sm mt-2">Students can post their theses to make them available for minting.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {theses.map((thesis) => {
                  const mintCount = mintCounts[thesis.id] || 0;
                  const isHot = mintCount > 5;
                  
                  return (
                    <motion.div
                      key={thesis.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleThesisSelect(thesis)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all relative ${
                        selectedThesis?.id === thesis.id
                          ? 'bg-blue-600/20 border-blue-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {isHot && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          HOT
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
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
                            <span className="flex items-center gap-1 text-green-400">
                              <Coins className="w-4 h-4" />
                              {mintCount} mints
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{thesis.university} • {thesis.field}</p>
                          {thesis.description && (
                            <p className="text-gray-400 text-sm">{thesis.description}</p>
                          )}
                          {thesis.tags && thesis.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {thesis.tags.map((tag: string, index: number) => (
                                <span key={index} className="bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          {selectedThesis?.id === thesis.id && (
                            <CheckCircle className="w-6 h-6 text-blue-400 mb-2" />
                          )}
                          <div className="text-green-400 font-semibold">{mintCount} mints</div>
                          <div className="text-yellow-400 text-sm">{(mintCount * 0.04).toFixed(4)} CORE earned</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Minting Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Coins className="w-8 h-8 text-purple-400" />
              Minting Details
            </h3>

            <div className="space-y-6">
              {/* Selected Thesis */}
              {selectedThesis ? (
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-white/20">
                  <h4 className="text-white font-bold text-lg mb-2">Selected Thesis</h4>
                  <p className="text-blue-300 font-semibold">{selectedThesis.title}</p>
                  <p className="text-gray-300 text-sm">by {selectedThesis.author}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span>{mintCounts[selectedThesis.id] || 0} total mints</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-600/20 rounded-lg p-4 border border-gray-400/20">
                  <p className="text-gray-400 text-center">Select a thesis to mint</p>
                </div>
              )}

              {/* Discount Status */}
              {hasDiscount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-600/20 border border-green-400/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-400 font-semibold">20% Discount Applied!</p>
                      <p className="text-sm text-green-300">
                        You've staked {stakedAmount} CORE tokens
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Mint Quantity (1-5 NFTs)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setMintQuantity(num)}
                      className={`w-12 h-12 rounded-lg font-semibold transition-all ${
                        mintQuantity === num
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Base fee per NFT:</span>
                  <span>{baseFee} CORE</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount (20%):</span>
                    <span>-{(baseFee * discountRate).toFixed(4)} CORE</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Final fee per NFT:</span>
                  <span>{finalFee.toFixed(4)} CORE</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Quantity:</span>
                  <span>{mintQuantity}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total Cost:</span>
                    <span>{totalCost.toFixed(4)} CORE</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ ${(totalCost * 1.2).toFixed(2)} USD
                  </p>
                </div>
              </div>

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={!selectedThesis || isMinting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMinting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Minting on Blockchain...
                  </div>
                ) : (
                  `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}`
                )}
              </Button>

              {selectedThesis && (
                <p className="text-xs text-gray-500 text-center">
                  You'll receive NFT certificates for this thesis research
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MintingSection;

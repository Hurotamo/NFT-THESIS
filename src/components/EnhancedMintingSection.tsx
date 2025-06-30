import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Coins, CheckCircle, AlertCircle, User, Calendar, BookOpen, Activity, TrendingUp, Lock, Eye, EyeOff, Search, Sparkles, Zap, Award, Crown, Wallet, Users } from 'lucide-react';
import { Button } from "@/components/buttons/Button";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { NFTMetadata, MintedNFT } from '@/services/nftContractService';
import { NFTContractService } from '@/services/nftContractService';
import { StakingService } from '@/services/stakingService';
import { ethers } from 'ethers';

interface ThesisInfo {
  title?: string;
  author?: string;
  university?: string;
  year?: string;
  field?: string;
  description?: string;
  ipfsHash?: string;
  tags?: string[];
  metadataUri?: string;
}

interface EnhancedMintingSectionProps {
  walletAddress: string;
}

const EnhancedMintingSection: React.FC<EnhancedMintingSectionProps> = ({ walletAddress }) => {
  const [selectedThesis, setSelectedThesis] = useState<ThesisInfo | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();
  
  const { 
    thesis, 
    mintCounts, 
    isLoading, 
    refreshStats, 
    lastUpdate 
  } = useRealTimeUpdates();

  const [userMintedNFTs, setUserMintedNFTs] = useState<MintedNFT[]>([]);
  const [totalStaked, setTotalStaked] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [uploaderAddress, setUploaderAddress] = useState<string | null>(null);
  const [mintPrice, setMintPrice] = useState<string>('0');
  const [finalCost, setFinalCost] = useState<string>('0');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [collaborators, setCollaborators] = useState<{ address: string; share: number }[]>([]);
  const [royaltyFee, setRoyaltyFee] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nftService = NFTContractService.getInstance();
    const stakingService = StakingService.getInstance();
    const loadUserData = async () => {
      if (walletAddress) {
        try {
          const [staked, discount, nfts] = await Promise.all([
            stakingService.getTotalStaked(),
            stakingService.hasDiscountEligibility(),
            nftService.getUserMintedNFTs()
          ]);
          
          setTotalStaked(staked);
          setHasDiscount(discount);
          setUserMintedNFTs(nfts);
        } catch (error: unknown) {
          console.error('Failed to load user data:', error);
        }
      }
    };

    loadUserData();
  }, [walletAddress]);

  // Fetch uploader and mint price when a thesis is selected
  useEffect(() => {
    const fetchMintPrice = async (): Promise<void> => {
      if (!selectedThesis?.author) {
        setUploaderAddress(null);
        setMintPrice('0');
        setFinalCost('0');
        return;
      }
      
      const uploader = selectedThesis.author;
      setUploaderAddress(uploader);
      try {
        const nftService = NFTContractService.getInstance();
        const priceBN = await nftService.getMintPriceForUploader(uploader);
        const price = ethers.utils.formatEther(priceBN);
        setMintPrice(price);
        // Calculate discount and total cost
        const stakedAmount = totalStaked; // Use real staked amount
        const hasDiscount = stakedAmount >= 3;
        const discountRate = hasDiscount ? 0.2 : 0;
        const discounted = parseFloat(price) * (1 - discountRate);
        const platformFee = discounted * 0.2;
        setFinalCost((discounted + platformFee).toFixed(4));
      } catch {
        setMintPrice('0');
        setFinalCost('0');
      }
    };
    fetchMintPrice();
  }, [selectedThesis, totalStaked]);

  const handleThesisSelect = (thesis: ThesisInfo) => {
    setSelectedThesis(thesis);
    toast({
      title: "Thesis Selected",
      description: `Selected "${thesis.title}" for minting`,
    });
  };

  const canUserMintThesis = (ipfsHash: string): boolean => {
    // Check if user has already minted this thesis
    return !userMintedNFTs.some(nft => nft.metadata.ipfsHash === ipfsHash);
  };

  const handleMint = async () => {
    if (!selectedThesis || !uploaderAddress) {
      toast({
        title: "No Thesis Selected",
        description: "Please select a thesis to mint",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedThesis.ipfsHash) {
      toast({
        title: "Missing Metadata URI",
        description: "No IPFS metadata URI found for this thesis.",
        variant: "destructive",
      });
      return;
    }
    
    if (!canUserMintThesis(selectedThesis.ipfsHash)) {
      toast({
        title: "Already Minted",
        description: "You can only mint 1 NFT per thesis per wallet",
        variant: "destructive",
      });
      return;
    }
    
    setIsMinting(true);
    setTxHash(null);
    try {
      const nftService = NFTContractService.getInstance();
      const txReceipt = await nftService.mintNFTForUploader(uploaderAddress, selectedThesis.ipfsHash, totalStaked);
      setTxHash(txReceipt.transactionHash);
      toast({
        title: "NFT Minted Successfully!",
        description: `Transaction: ${txReceipt.transactionHash}`,
      });
      setSelectedThesis(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mint NFT. Please try again.";
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement collaborative NFT minting logic here
  };

  const handleAddressChange = (index: number, address: string) => {
    // Implement address change logic here
  };

  const handleShareChange = (index: number, share: number) => {
    // Implement share change logic here
  };

  const removeCollaborator = (index: number) => {
    // Implement remove collaborator logic here
  };

  const addCollaborator = () => {
    // Implement add collaborator logic here
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-12 border border-gray-700/50 text-center max-w-md mx-auto shadow-2xl"
        >
          <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-gray-300 mb-6">Please connect your wallet to start minting NFTs.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg text-blue-400">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Connect Wallet</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-12 border border-gray-700/50 text-center max-w-md mx-auto shadow-2xl"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-6" style={{ animationDelay: '-0.5s' }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Thesis Market</h3>
          <p className="text-gray-400">Fetching available research papers...</p>
        </motion.div>
      </div>
    );
  }

  // Defensive default for thesis
  const thesisList = Array.isArray(thesis) ? thesis : [];
  const filteredThesisList = thesisList.filter((t: ThesisInfo) => {
    const term = searchTerm.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(term)) ||
      (t.author && t.author.toLowerCase().includes(term)) ||
      (t.ipfsHash && t.ipfsHash.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full px-6 py-3 mb-8">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Academic NFT Marketplace</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            🎓 Thesis NFT Minting
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-6 leading-relaxed">
            Support fellow researchers and universities by minting unique Thesis NFTs — 
            <span className="text-blue-400 font-semibold"> one NFT per thesis</span>.
          </p>
          
          <div className="inline-flex items-center gap-6 text-sm text-gray-500 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Live Market</span>
            </div>
            <span>•</span>
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <span>•</span>
            <span>{filteredThesisList.length} available theses</span>
          </div>
        </motion.div>

        {/* Enhanced Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12"
        >
          {[
            { 
              label: "Available Theses", 
              value: "0", 
              icon: FileText, 
              color: "blue",
              gradient: "from-blue-500 to-cyan-500"
            },
            { 
              label: "Your NFTs", 
              value: userMintedNFTs.length.toString(), 
              icon: Crown, 
              color: "yellow",
              gradient: "from-yellow-500 to-orange-500"
            },
            { 
              label: "Staked CORE", 
              value: totalStaked.toFixed(2), 
              icon: Coins, 
              color: "green",
              gradient: "from-green-500 to-emerald-500"
            },
            { 
              label: "Discount", 
              value: hasDiscount ? '20%' : '0%', 
              icon: Award, 
              color: "purple",
              gradient: "from-purple-500 to-pink-500"
            },
            { 
              label: "Mint Price", 
              value: `${finalCost} tCORE2`, 
              icon: Zap, 
              color: "indigo",
              gradient: "from-indigo-500 to-blue-500"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500`} />
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 text-center group hover:transform hover:scale-105">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Enhanced Thesis Selection */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-3xl font-bold text-white">Search Thesis</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, or address..."
                  className="w-full md:w-80 pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-sm transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {filteredThesisList.map((thesis: ThesisInfo, index) => (
                  <motion.div
                    key={thesis.ipfsHash}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`group relative backdrop-blur-xl rounded-xl p-6 border cursor-pointer transition-all duration-300 ${
                      selectedThesis?.ipfsHash === thesis.ipfsHash
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-400/50 shadow-2xl shadow-blue-500/20'
                        : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/30 hover:bg-white/15'
                    } ${!thesis.ipfsHash || !canUserMintThesis(thesis.ipfsHash) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => thesis.ipfsHash && canUserMintThesis(thesis.ipfsHash) && handleThesisSelect(thesis)}
                  >
                    {/* Background Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                    
                    <div className="relative flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-2 text-lg group-hover:text-blue-300 transition-colors">
                          {thesis.title}
                        </h4>
                        <p className="text-gray-300 mb-3 font-medium">{thesis.author}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                            <BookOpen className="w-4 h-4" />
                            {thesis.field}
                          </span>
                          <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                            <Calendar className="w-4 h-4" />
                            {thesis.year}
                          </span>
                        </div>
                      </div>
                      {thesis.ipfsHash && !canUserMintThesis(thesis.ipfsHash) && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Enhanced Minting Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-6 flex items-center gap-2">
              <Zap className="w-7 h-7 text-purple-400 animate-pulse" /> Minting Panel
            </h3>
            <AnimatePresence mode="wait">
              {selectedThesis ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="backdrop-blur-2xl bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-black/80 rounded-3xl p-10 border-2 border-blue-500/40 shadow-2xl ring-2 ring-blue-400/20"
                >
                  <div className="mb-8 flex items-center gap-4">
                    <FileText className="w-10 h-10 text-blue-400" />
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-1">{selectedThesis.title}</h4>
                      <p className="text-blue-200 font-medium">{selectedThesis.author}</p>
                    </div>
                  </div>
                  {/* Enhanced Cost Breakdown */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-2xl p-6 border border-blue-400/20">
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-400" /> Cost Breakdown
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between text-blue-200 text-lg">
                          <span>Base mint price:</span>
                          <span className="font-mono">{mintPrice} tCORE2</span>
                        </div>
                        <div className="flex justify-between text-green-300 text-lg">
                          <span>Discount ({hasDiscount ? '20%' : '0%'}):</span>
                          <span className="font-mono">
                            -{hasDiscount ? (parseFloat(mintPrice) * 0.2).toFixed(4) : '0.0000'} tCORE2
                          </span>
                        </div>
                        <div className="flex justify-between text-yellow-300 text-lg">
                          <span>Platform fee (20%):</span>
                          <span className="font-mono">
                            +{(parseFloat(mintPrice) * (hasDiscount ? 0.8 : 1) * 0.2).toFixed(4)} tCORE2
                          </span>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <div className="flex justify-between text-white font-extrabold text-2xl">
                            <span>Total Cost:</span>
                            <span className="font-mono bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              {finalCost} tCORE2
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Enhanced Mint Button */}
                  <Button
                    onClick={handleMint}
                    disabled={!selectedThesis || isMinting}
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white py-5 rounded-2xl font-extrabold text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    {isMinting ? (
                      <>
                        <span className="relative flex h-6 w-6">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <Zap className="relative w-6 h-6 text-yellow-400 animate-spin" />
                        </span>
                        Minting on Blockchain...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Mint 1 NFT
                      </>
                    )}
                  </Button>
                  {txHash && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-600/20 border-2 border-green-400/40 rounded-2xl text-center shadow-lg"
                    >
                      <CheckCircle className="w-7 h-7 text-green-400 mx-auto mb-2 animate-bounce" />
                      <p className="text-green-400 font-bold mb-1 text-lg">Successfully Minted!</p>
                      <a 
                        href={`https://explorer.coredao.org/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-200 text-sm underline hover:text-green-100 transition-colors"
                      >
                        View Transaction
                      </a>
                    </motion.div>
                  )}
                  {/* Enhanced Info Card */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-400/20 rounded-xl flex items-center gap-3">
                    <Lock className="w-6 h-6 text-blue-400 flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="text-blue-300 font-semibold mb-1">NFT Content Locked</p>
                      <p className="text-gray-400 text-sm">Content becomes visible after auction completion for added exclusivity</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="backdrop-blur-2xl bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-black/80 rounded-3xl p-12 border-2 border-blue-500/40 text-center shadow-2xl"
                >
                  <div className="p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-28 h-28 mx-auto mb-8 flex items-center justify-center">
                    <FileText className="w-14 h-14 text-blue-400" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">Select a Thesis</h4>
                  <p className="text-gray-400">Choose a thesis from the list to start minting your NFT</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Enhanced User's Minted NFTs */}
        {userMintedNFTs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <h3 className="text-3xl font-bold text-white mb-8 text-center">Your NFT Collection</h3>
            <div className="grid gap-6">
              {userMintedNFTs.map((nft, idx) => (
                <motion.div
                  key={nft.tokenId || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {nft.metadata.title || `NFT #${idx + 1}`}
                      </h4>
                      <p className="text-gray-400 mb-3">Token ID: {nft.tokenId}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {nft.isBlurred ? (
                        <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-4 py-2">
                          <Lock className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-300 text-sm font-medium">Locked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-green-600/20 border border-green-400/30 rounded-full px-4 py-2">
                          <Eye className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm font-medium">Unlocked</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {nft.isBlurred ? (
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-400/30 rounded-xl p-4 text-center">
                      <p className="text-blue-300 italic mb-2 font-medium">{nft.blurredContent}</p>
                      <span className="text-xs text-blue-400">Content will unlock after auction completion</span>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-400/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-medium">Full content unlocked!</span>
                        <a 
                          href={`https://ipfs.io/ipfs/${nft.metadata.ipfsHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-green-300 text-sm underline hover:text-green-200 transition-colors"
                        >
                          View File
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Collaborative NFT Minting Card */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <div className="backdrop-blur-2xl bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-black/90 rounded-3xl p-10 border-2 border-blue-500/40 shadow-2xl">
            <h2 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-6 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-400 animate-pulse" /> Collaborative NFT Minting
            </h2>
            <p className="text-blue-200 mb-8">Mint an NFT with multiple collaborators and split royalties. Add up to 10 collaborators. Total shares must add up to 100%.</p>
            <form onSubmit={handleSubmit} className="space-y-8">
              {collaborators.map((collab, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-xl p-4 border border-blue-400/20 mb-2">
                  <div className="w-full md:w-2/3">
                    <label className="block text-blue-200 font-semibold mb-1" htmlFor={`collab-address-${idx}`}>Collaborator Address</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                      <input
                        id={`collab-address-${idx}`}
                        type="text"
                        placeholder="0x..."
                        value={collab.address}
                        onChange={e => handleAddressChange(idx, e.target.value)}
                        className="pl-10 pr-3 py-3 rounded-xl bg-black/60 border border-blue-500/30 text-blue-100 placeholder-blue-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 w-full transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-blue-200 font-semibold mb-1" htmlFor={`collab-share-${idx}`}>Royalty %</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                      <input
                        id={`collab-share-${idx}`}
                        type="number"
                        placeholder="e.g. 10"
                        value={collab.share}
                        onChange={e => handleShareChange(idx, Number(e.target.value))}
                        className="pl-10 pr-3 py-3 rounded-xl bg-black/60 border border-blue-500/30 text-blue-100 placeholder-blue-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 w-full transition-all duration-200"
                        min={0}
                        max={100}
                        required
                      />
                    </div>
                  </div>
                  {collaborators.length > 1 && (
                    <button type="button" onClick={() => removeCollaborator(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold mt-6 md:mt-8 px-3 py-2 rounded transition-colors bg-red-900/20 border border-red-400/20">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addCollaborator} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2">
                <User className="w-5 h-5" /> + Add Collaborator
              </button>
              <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
                <div className="w-full md:w-1/2">
                  <label className="block text-blue-200 font-semibold mb-1" htmlFor="royalty-fee">Royalty Fee (basis points)</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      id="royalty-fee"
                      type="number"
                      placeholder="e.g. 500 = 5%"
                      value={royaltyFee}
                      onChange={e => setRoyaltyFee(Number(e.target.value))}
                      className="pl-10 pr-3 py-3 rounded-xl bg-black/60 border border-blue-500/30 text-blue-100 placeholder-blue-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 w-full transition-all duration-200"
                      min={0}
                      max={1000}
                      required
                    />
                  </div>
                </div>
                <span className="text-xs text-blue-300 mt-6 md:mt-10">(e.g., 500 = 5%, max 1000 = 10%)</span>
              </div>
              {error && <div className="text-red-400 text-sm font-bold mt-2">{error}</div>}
              <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white py-4 rounded-2xl font-extrabold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mt-4">
                <Sparkles className="w-6 h-6" /> Mint Collaborative NFT
              </Button>
            </form>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default EnhancedMintingSection;

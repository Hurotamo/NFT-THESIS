import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Clock, Shield, TrendingUp, AlertCircle, FileText, Users, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from '@/hooks/useContracts';
import { Auction, Bid } from '@/services/auctionService';

interface AuctionSectionProps {
  walletAddress: string;
}

const AuctionSection: React.FC<AuctionSectionProps> = ({ walletAddress }) => {
  const [bidAmount, setBidAmount] = useState<{ [key: string]: string }>({});
  const [isBidding, setIsBidding] = useState<{ [key: string]: boolean }>({});
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [startingPrice, setStartingPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('7');
  const [isListing, setIsListing] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [userBids, setUserBids] = useState<{ auctionId: string; bid: Bid }[]>([]);
  const { toast } = useToast();
  const {
    getActiveAuctions,
    getUserBids,
    placeBid,
    createAuction,
    isConnected,
    currentAccount,
  } = useContracts();

  // Poll for real-time auction data
  useEffect(() => {
    const fetchAuctions = () => {
      const active = getActiveAuctions();
      setAuctions(active);
      if (walletAddress) {
        setUserBids(getUserBids());
      }
    };
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 180000);
    return () => clearInterval(interval);
  }, [getActiveAuctions, getUserBids, walletAddress]);

  const handlePlaceBid = async (auctionId: string, minBid: number) => {
    const bidValue = bidAmount[auctionId];
    if (!bidValue) {
      toast({
        title: "Enter Bid Amount",
        description: "Please enter a bid amount",
        variant: "destructive",
      });
      return;
    }
    const bid = parseFloat(bidValue);
    if (isNaN(bid) || bid <= minBid) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be higher than ${minBid} CORE`,
        variant: "destructive",
      });
      return;
    }
    setIsBidding(prev => ({ ...prev, [auctionId]: true }));
    try {
      const success = await placeBid(auctionId, bid);
      if (success) {
        toast({
          title: "Bid Placed Successfully!",
          description: `Your bid of ${bid} CORE has been placed and held in escrow`,
        });
        setBidAmount(prev => ({ ...prev, [auctionId]: '' }));
      }
    } catch (error) {
      toast({
        title: "Bid Failed",
        description: "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBidding(prev => ({ ...prev, [auctionId]: false }));
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
          <p className="text-gray-300">Please connect your wallet to participate in auctions.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            NFT Auction Marketplace
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            List your thesis NFTs for auction or bid on others. All transactions are secured with smart contract escrow on Core Testnet.
          </p>
        </motion.div>
        {/* Active Auctions */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            Live Auctions ({auctions.length})
          </h3>
          <div className="grid gap-6">
            {auctions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No live auctions at the moment.</p>
              </div>
            ) : (
              auctions.map((auction) => {
                const currentBid = auction.bids.length > 0 ? Math.max(...auction.bids.map((b: Bid) => b.amount)) : auction.config.startingPrice;
                const highestBidder = auction.bids.length > 0 ? auction.bids.reduce((prev: Bid, curr: Bid) => curr.amount > prev.amount ? curr : prev).bidder : null;
                const totalBids = auction.bids.length;
                const reservePrice = auction.config.reservePrice;
                const timeLeft = Math.max(0, Math.floor((new Date(auction.endTime).getTime() - Date.now()) / 1000));
                const formatTime = (seconds: number) => {
                  if (seconds <= 0) return 'Ended';
                  const d = Math.floor(seconds / (3600 * 24));
                  const h = Math.floor((seconds % (3600 * 24)) / 3600);
                  const m = Math.floor((seconds % 3600) / 60);
                  return `${d}d ${h}h ${m}m`;
                };
                return (
                  <motion.div
                    key={auction.id}
                    whileHover={{ scale: 1.01 }}
                    className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* NFT Preview */}
                      <div className="md:col-span-1">
                        <motion.div
                          whileHover={{ rotateY: 5 }}
                          className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-6 text-center border border-white/10"
                        >
                          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <h4 className="text-white font-bold text-lg mb-2">{auction.nftTokenId}</h4>
                          <p className="text-gray-300 text-sm">Seller: {auction.seller}</p>
                        </motion.div>
                      </div>
                      {/* Auction Info */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-bold text-white">Auction ID: {auction.id}</h4>
                            <p className="text-gray-400">Seller: {auction.seller}</p>
                          </div>
                          <div className="flex items-center gap-2 text-orange-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-semibold">{formatTime(timeLeft)}</span>
                          </div>
                        </div>
                        {/* Bid Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Current Bid</p>
                            <p className="text-2xl font-bold text-green-400">{currentBid} CORE</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Total Bids</p>
                            <p className="text-xl font-semibold text-white flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {totalBids}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Reserve Price</p>
                            <p className="text-lg font-semibold text-purple-400">{reservePrice} CORE</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Highest Bidder</p>
                            <p className="text-sm text-yellow-400 font-mono">
                              {highestBidder || 'None'}
                            </p>
                          </div>
                        </div>
                        {/* Bidding Section */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={bidAmount[auction.id] || ''}
                                onChange={(e) => setBidAmount(prev => ({ ...prev, [auction.id]: e.target.value }))}
                                placeholder={`Min: ${(currentBid + 0.1).toFixed(1)} CORE`}
                                step="0.1"
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                              />
                            </div>
                            <Button
                              onClick={() => handlePlaceBid(auction.id, currentBid)}
                              disabled={isBidding[auction.id] || !bidAmount[auction.id]}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                            >
                              {isBidding[auction.id] ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Bidding...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-4 h-4" />
                                  Place Bid
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuctionSection;

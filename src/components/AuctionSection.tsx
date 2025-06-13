
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Clock, Shield, TrendingUp, AlertCircle, FileText, Users, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AuctionSectionProps {
  walletAddress: string;
}

interface MockNFT {
  id: string;
  title: string;
  author: string;
  university: string;
  currentBid: number;
  timeLeft: string;
  isListed: boolean;
  totalBids: number;
  highestBidder?: string;
  reservePrice?: number;
  auctionEndTime?: Date;
}

interface BidHistory {
  bidder: string;
  amount: number;
  timestamp: Date;
}

const AuctionSection: React.FC<AuctionSectionProps> = ({ walletAddress }) => {
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [startingPrice, setStartingPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('7');
  const [isListing, setIsListing] = useState(false);
  const [bidAmount, setBidAmount] = useState<{[key: string]: string}>({});
  const [isBidding, setIsBidding] = useState<{[key: string]: boolean}>({});
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [bidHistory, setBidHistory] = useState<{[key: string]: BidHistory[]}>({});
  const { toast } = useToast();

  // Mock user NFTs
  const userNFTs: MockNFT[] = [
    {
      id: '1',
      title: 'Quantum Computing Applications in Cryptography',
      author: 'Dr. Alice Johnson',
      university: 'MIT',
      currentBid: 0,
      timeLeft: 'Not Listed',
      isListed: false,
      totalBids: 0,
    },
    {
      id: '2',
      title: 'Machine Learning for Climate Prediction',
      author: 'Dr. Bob Smith',
      university: 'Stanford',
      currentBid: 2.5,
      timeLeft: '3d 12h',
      isListed: true,
      totalBids: 8,
      highestBidder: '0x1234...5678',
      reservePrice: 1.0,
    },
  ];

  // Mock active auctions with enhanced data
  const activeAuctions: MockNFT[] = [
    {
      id: '3',
      title: 'Blockchain Governance Mechanisms',
      author: 'Dr. Carol Wilson',
      university: 'Harvard',
      currentBid: 1.8,
      timeLeft: '1d 6h',
      isListed: true,
      totalBids: 12,
      highestBidder: '0xabcd...efgh',
      reservePrice: 1.0,
    },
    {
      id: '4',
      title: 'Neural Networks in Autonomous Vehicles',
      author: 'Dr. David Chen',
      university: 'Berkeley',
      currentBid: 3.2,
      timeLeft: '5d 2h',
      isListed: true,
      totalBids: 15,
      highestBidder: '0x9876...4321',
      reservePrice: 2.0,
    },
    {
      id: '5',
      title: 'Advanced Cryptographic Protocols',
      author: 'Dr. Emma Rodriguez',
      university: 'Stanford',
      currentBid: 0.8,
      timeLeft: '2d 8h',
      isListed: true,
      totalBids: 3,
      reservePrice: 0.5,
    },
  ];

  // Initialize bid history
  useEffect(() => {
    const mockHistory: {[key: string]: BidHistory[]} = {
      '3': [
        { bidder: '0x1111...2222', amount: 1.0, timestamp: new Date(Date.now() - 3600000) },
        { bidder: '0x3333...4444', amount: 1.5, timestamp: new Date(Date.now() - 1800000) },
        { bidder: '0xabcd...efgh', amount: 1.8, timestamp: new Date(Date.now() - 900000) },
      ],
      '4': [
        { bidder: '0x5555...6666', amount: 2.0, timestamp: new Date(Date.now() - 7200000) },
        { bidder: '0x7777...8888', amount: 2.8, timestamp: new Date(Date.now() - 3600000) },
        { bidder: '0x9876...4321', amount: 3.2, timestamp: new Date(Date.now() - 1800000) },
      ],
    };
    setBidHistory(mockHistory);
  }, []);

  const handleListNFT = async () => {
    if (!selectedNFT || !startingPrice) {
      toast({
        title: "Missing Information",
        description: "Please select an NFT and set a starting price",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid starting price",
        variant: "destructive",
      });
      return;
    }

    setIsListing(true);
    try {
      // Simulate listing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "NFT Listed Successfully!",
        description: `Your thesis NFT is now live in the auction with escrow protection`,
      });
      
      // Reset form
      setSelectedNFT('');
      setStartingPrice('');
    } catch (error) {
      toast({
        title: "Listing Failed",
        description: "Failed to list NFT for auction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsListing(false);
    }
  };

  const handlePlaceBid = async (nftId: string) => {
    const bidValue = bidAmount[nftId];
    if (!bidValue) {
      toast({
        title: "Enter Bid Amount",
        description: "Please enter a bid amount",
        variant: "destructive",
      });
      return;
    }

    const bid = parseFloat(bidValue);
    const nft = activeAuctions.find(n => n.id === nftId);
    
    if (!nft) return;

    if (isNaN(bid) || bid <= nft.currentBid) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be higher than ${nft.currentBid} CORE`,
        variant: "destructive",
      });
      return;
    }

    setIsBidding(prev => ({ ...prev, [nftId]: true }));

    try {
      // Simulate bid placement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add to bid history
      const newBid: BidHistory = {
        bidder: walletAddress,
        amount: bid,
        timestamp: new Date(),
      };
      
      setBidHistory(prev => ({
        ...prev,
        [nftId]: [...(prev[nftId] || []), newBid]
      }));

      toast({
        title: "Bid Placed Successfully!",
        description: `Your bid of ${bid} CORE has been placed and held in escrow`,
      });
      
      // Clear bid input
      setBidAmount(prev => ({ ...prev, [nftId]: '' }));
    } catch (error) {
      toast({
        title: "Bid Failed",
        description: "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBidding(prev => ({ ...prev, [nftId]: false }));
    }
  };

  const formatTimeLeft = (timeLeft: string) => {
    if (timeLeft === 'Not Listed') return timeLeft;
    return timeLeft;
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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* List NFT Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 sticky top-24">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Gavel className="w-8 h-8 text-purple-400" />
                List for Auction
              </h3>

              <div className="space-y-4">
                {/* NFT Selection */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Select Your NFT
                  </label>
                  <select
                    value={selectedNFT}
                    onChange={(e) => setSelectedNFT(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Choose an NFT...</option>
                    {userNFTs.filter(nft => !nft.isListed).map((nft) => (
                      <option key={nft.id} value={nft.id} className="bg-gray-800">
                        {nft.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starting Price */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Starting Price (CORE)
                  </label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Auction Duration */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Auction Duration (Days)
                  </label>
                  <select
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="1" className="bg-gray-800">1 Day</option>
                    <option value="3" className="bg-gray-800">3 Days</option>
                    <option value="7" className="bg-gray-800">7 Days</option>
                    <option value="14" className="bg-gray-800">14 Days</option>
                  </select>
                </div>

                {/* Escrow Info */}
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h4 className="text-blue-400 font-semibold">Escrow Protected</h4>
                  </div>
                  <p className="text-sm text-blue-300">
                    All bids are held in smart contract escrow until auction completion.
                  </p>
                </div>

                <Button
                  onClick={handleListNFT}
                  disabled={!selectedNFT || !startingPrice || isListing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isListing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Listing...
                    </div>
                  ) : (
                    'List for Auction'
                  )}
                </Button>
              </div>
            </div>
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
              Live Auctions ({activeAuctions.length})
            </h3>

            <div className="grid gap-6">
              {activeAuctions.map((nft) => (
                <motion.div
                  key={nft.id}
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
                        <h4 className="text-white font-bold text-lg mb-2">{nft.title}</h4>
                        <p className="text-gray-300 text-sm">by {nft.author}</p>
                        <p className="text-gray-400 text-xs mt-1">{nft.university}</p>
                      </motion.div>
                    </div>

                    {/* Auction Info */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-white">{nft.title}</h4>
                          <p className="text-gray-400">by {nft.author} • {nft.university}</p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{formatTimeLeft(nft.timeLeft)}</span>
                        </div>
                      </div>

                      {/* Bid Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Current Bid</p>
                          <p className="text-2xl font-bold text-green-400">{nft.currentBid} CORE</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Bids</p>
                          <p className="text-xl font-semibold text-white flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {nft.totalBids}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Reserve Price</p>
                          <p className="text-lg font-semibold text-purple-400">{nft.reservePrice} CORE</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Highest Bidder</p>
                          <p className="text-sm text-yellow-400 font-mono">
                            {nft.highestBidder || 'None'}
                          </p>
                        </div>
                      </div>

                      {/* Bidding Section */}
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={bidAmount[nft.id] || ''}
                              onChange={(e) => setBidAmount(prev => ({ ...prev, [nft.id]: e.target.value }))}
                              placeholder={`Min: ${(nft.currentBid + 0.1).toFixed(1)} CORE`}
                              step="0.1"
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                            />
                          </div>
                          <Button
                            onClick={() => handlePlaceBid(nft.id)}
                            disabled={isBidding[nft.id] || !bidAmount[nft.id]}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                          >
                            {isBidding[nft.id] ? (
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

                      {/* Bid History Toggle */}
                      <Button
                        onClick={() => setSelectedAuction(selectedAuction === nft.id ? null : nft.id)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 w-full"
                      >
                        {selectedAuction === nft.id ? 'Hide' : 'Show'} Bid History
                      </Button>

                      {/* Bid History */}
                      {selectedAuction === nft.id && bidHistory[nft.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <h5 className="text-white font-semibold mb-3">Bid History</h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {bidHistory[nft.id].slice().reverse().map((bid, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                                <div>
                                  <p className="text-sm font-mono text-gray-300">{bid.bidder}</p>
                                  <p className="text-xs text-gray-400">{bid.timestamp.toLocaleString()}</p>
                                </div>
                                <p className="text-green-400 font-bold">{bid.amount} CORE</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Your Listed NFTs */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white mb-6">Your Listed NFTs</h3>
              <div className="grid gap-4">
                {userNFTs.filter(nft => nft.isListed).map((nft) => (
                  <div
                    key={nft.id}
                    className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="text-white font-semibold">{nft.title}</h4>
                      <p className="text-gray-400 text-sm">Current bid: {nft.currentBid} CORE • {nft.totalBids} bids</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-semibold">{nft.timeLeft}</p>
                      <p className="text-gray-400 text-sm">Time left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuctionSection;

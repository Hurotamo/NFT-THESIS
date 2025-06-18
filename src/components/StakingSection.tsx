import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Gift, AlertCircle, Lock, Unlock, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/contexts/Web3Context';
import { StakePosition } from '@/services/stakingService';

interface StakingSectionProps {
  walletAddress: string;
}

const StakingSection: React.FC<StakingSectionProps> = ({ walletAddress }) => {
  const [stakeInput, setStakeInput] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [totalStaked, setTotalStaked] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [userStakes, setUserStakes] = useState<StakePosition[]>([]);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const { toast } = useToast();
  const { stakeTokens, unstakeTokens, getTotalStaked, hasDiscountEligibility, getUserStakes } = useContracts();
  const { isConnected } = useWeb3();

  const minimumStake = 3; // 3 tCORE2 for discount eligibility
  const availableBalance = 500; // Mock balance - in real app, get from wallet

  useEffect(() => {
    const loadStakingData = async () => {
      if (isConnected && walletAddress) {
        try {
          const [staked, discount, stakes] = await Promise.all([
            getTotalStaked(),
            hasDiscountEligibility(),
            getUserStakes()
          ]);
          
          setTotalStaked(staked);
          setHasDiscount(discount);
          setUserStakes(stakes);
          
          // Get unlock time if user has staked
          if (stakes.length > 0) {
            setUnlockTime(stakes[0].unlockTime);
          }
        } catch (error) {
          console.error('Failed to load staking data:', error);
        }
      }
    };

    loadStakingData();
  }, [isConnected, walletAddress, getTotalStaked, hasDiscountEligibility, getUserStakes]);

  // Update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (unlockTime) {
        const now = new Date();
        const diff = unlockTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeRemaining('Ready to unstake');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [unlockTime]);

  const handleStake = async () => {
    const amount = parseFloat(stakeInput);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }

    if (amount < minimumStake) {
      toast({
        title: "Insufficient Amount",
        description: `Minimum stake amount is ${minimumStake} tCORE2`,
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough tCORE2 tokens",
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);
    try {
      const position = await stakeTokens(amount);
      
      // Refresh data
      const [staked, discount, stakes] = await Promise.all([
        getTotalStaked(),
        hasDiscountEligibility(),
        getUserStakes()
      ]);
      
      setTotalStaked(staked);
      setHasDiscount(discount);
      setUserStakes(stakes);
      setUnlockTime(position.unlockTime);
      setStakeInput('');
      
      toast({
        title: "Staking Successful",
        description: `Staked ${amount} tCORE2 tokens for 30 days`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to stake tokens. Please try again.";
      toast({
        title: "Staking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!unlockTime || new Date() < unlockTime) {
      toast({
        title: "Cannot Unstake",
        description: "Your tokens are still locked for 30 days",
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    try {
      const result = await unstakeTokens();
      
      // Refresh data
      const [staked, discount, stakes] = await Promise.all([
        getTotalStaked(),
        hasDiscountEligibility(),
        getUserStakes()
      ]);
      
      setTotalStaked(staked);
      setHasDiscount(discount);
      setUserStakes(stakes);
      setUnlockTime(null);
      setTimeRemaining('');
      
      toast({
        title: "Unstaking Successful",
        description: `Unstaked ${result?.amount} tCORE2 tokens`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to unstake tokens. Please try again.";
      toast({
        title: "Unstaking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(false);
    }
  };

  const canUnstake = unlockTime && new Date() >= unlockTime;

  if (!walletAddress || !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-gray-300">Please connect your wallet to start staking tCORE2 tokens.</p>
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
            Stake tCORE2 Tokens
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stake 3+ tCORE2 tokens to unlock a 20% discount on all NFT minting fees. Tokens are locked for 30 days.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Staking Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Current Stake Card */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-400" />
                  Your Stake
                </h3>
                {hasDiscount && (
                  <div className="flex items-center gap-2 bg-green-600/20 px-3 py-1 rounded-full">
                    <Gift className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-semibold">20% Discount Active</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {totalStaked.toFixed(2)}
                  </div>
                  <div className="text-gray-400">tCORE2 Staked</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {Math.max(0, minimumStake - totalStaked).toFixed(2)}
                  </div>
                  <div className="text-gray-400">Needed for Discount</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {hasDiscount ? '20%' : '0%'}
                  </div>
                  <div className="text-gray-400">Minting Discount</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress to Discount</span>
                  <span>{Math.min(100, (totalStaked / minimumStake) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalStaked / minimumStake) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      hasDiscount ? 'bg-green-400' : 'bg-blue-400'
                    }`}
                  />
                </div>
              </div>

              {/* Lock Status */}
              {userStakes.length > 0 && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-semibold">Lock Period</p>
                        <p className="text-gray-400 text-sm">{timeRemaining}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !canUnstake}
                      variant="outline"
                      size="sm"
                      className={canUnstake ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isUnstaking ? "Unstaking..." : canUnstake ? "Unstake" : "Locked"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Staking Form */}
            {userStakes.length === 0 && (
              <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Lock className="w-8 h-8 text-blue-400" />
                  Stake Tokens
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount to Stake (tCORE2)
                    </label>
                    <input
                      type="number"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      placeholder="Enter amount (minimum 3 tCORE2)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Minimum stake: {minimumStake} tCORE2 for 30 days
                    </p>
                  </div>

                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !stakeInput || parseFloat(stakeInput) < minimumStake}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {isStaking ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Staking...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Stake {stakeInput || minimumStake} tCORE2
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Benefits Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                Staking Benefits
              </h3>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">NFT Minting Discount</h4>
                      <p className="text-gray-400 text-sm">Get 20% off all NFT minting fees when you stake 3+ tCORE2</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Network Support</h4>
                      <p className="text-gray-400 text-sm">Support the Core Blockchain network by staking native tCORE2 tokens</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">One-Time Staking</h4>
                      <p className="text-gray-400 text-sm">Simple one-time stake with 30-day lock period</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Staking Requirements</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Minimum stake: 3 tCORE2</li>
                    <li>• Lock period: 30 days</li>
                    <li>• Discount: 20% on NFT minting</li>
                    <li>• One-time staking per wallet</li>
                  </ul>
                </div>

                <div className="bg-yellow-600/10 border border-yellow-400/20 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">Important Notes</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Tokens are locked for exactly 30 days</li>
                    <li>• Cannot unstake before lock period ends</li>
                    <li>• No partial unstaking - all or nothing</li>
                    <li>• Discount active immediately after staking</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StakingSection;

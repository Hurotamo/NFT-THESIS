import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  TrendingUp, 
  Gift, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Clock, 
  CheckCircle, 
  Info, 
  Shield, 
  Zap,
  Users,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Wallet,
  Percent,
  Timer
} from 'lucide-react';
import { Button } from "@/components/buttons/Button";
import { useToast } from "@/hooks/use-toast";
import { StakingService, StakePosition } from '@/services/stakingService';
import { ethers } from 'ethers';
import StakingAnalytics from './StakingAnalytics';
import StakingABI from '@/abis/Staking.json';
import { CONTRACT_ADDRESSES } from '@/config/contractAddresses';

interface StakingSectionProps {
  walletAddress: string;
}

interface StakingStats {
  totalStaked: number;
  totalStakers: number;
  discountPercent: number;
  hasActiveStake: boolean;
  isBlacklisted: boolean;
  emergencyMode: boolean;
  contractPaused: boolean;
}

const StakingSection: React.FC<StakingSectionProps> = ({ walletAddress }) => {
  const [stakeInput, setStakeInput] = useState('0.1');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stakingStats, setStakingStats] = useState<StakingStats>({
    totalStaked: 0,
    totalStakers: 0,
    discountPercent: 20,
    hasActiveStake: false,
    isBlacklisted: false,
    emergencyMode: false,
    contractPaused: false
  });
  const [userStakes, setUserStakes] = useState<StakePosition[]>([]);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pendingStake, setPendingStake] = useState(false);
  const [justStaked, setJustStaked] = useState(false);
  const { toast } = useToast();

  const REQUIRED_STAKE_AMOUNT = 0.1; // 0.1 tCORE2 as per contract
  const LOCK_PERIOD_HOURS = 3;

  // Initialize staking service
  useEffect(() => {
    if (walletAddress) {
      const stakingService = StakingService.getInstance();
      stakingService.setWalletAddress(walletAddress);
      loadStakingData();
    }
  }, [walletAddress]);

  const loadStakingData = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      
      // Load all data in parallel
      const [
        totalStaked,
        hasDiscount,
        stakes,
        config,
        unlockTimeData,
        balance
      ] = await Promise.all([
        stakingService.getTotalStaked(),
        stakingService.hasDiscountEligibility(),
        stakingService.getUserStakes(),
        stakingService.getStakingConfig(),
        stakingService.getUserUnlockTime(),
        getWalletBalance()
      ]);
      
      setStakingStats(prev => ({
        ...prev,
        totalStaked,
        hasActiveStake: hasDiscount,
        discountPercent: config.discountPercentage
      }));
      
      setUserStakes(stakes);
      setUnlockTime(unlockTimeData);
      setWalletBalance(balance);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to load staking data:', error);
      toast({
        title: "Data Load Error",
        description: "Failed to load staking information. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, toast]);

  const getWalletBalance = async (): Promise<number> => {
    try {
      if (window.ethereum) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest']
        });
        return parseFloat(ethers.utils.formatEther(balance as string));
      }
      return 0;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  };

  // Real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (unlockTime) {
        const now = new Date();
        const diff = unlockTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        } else {
          setTimeRemaining('Ready to unstake');
          // Auto-refresh data when lock period expires
          loadStakingData();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [unlockTime, loadStakingData]);

  // Restore polling mechanism for real-time updates
  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => {
      loadStakingData();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [walletAddress, loadStakingData]);

  const handleStake = async () => {
    const amount = parseFloat(stakeInput);
    if (isNaN(amount) || amount !== REQUIRED_STAKE_AMOUNT) {
      toast({
        title: "Invalid Amount",
        description: `Must stake exactly ${REQUIRED_STAKE_AMOUNT} tCORE2`,
        variant: "destructive",
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${REQUIRED_STAKE_AMOUNT} tCORE2 in your wallet`,
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);
    try {
      const stakingService = StakingService.getInstance();
      await stakingService.stakeTokens(amount);
      
      // Optimistically update UI for real-time feedback
      setStakingStats(prev => ({
        ...prev,
        hasActiveStake: true,
        totalStaked: REQUIRED_STAKE_AMOUNT,
        discountPercent: 20,
      }));
      setUserStakes([{ amount: REQUIRED_STAKE_AMOUNT, stakedAt: new Date(), unlockTime: new Date(Date.now() + LOCK_PERIOD_HOURS * 3600 * 1000), hasStaked: true, isActive: true }]);
      setUnlockTime(new Date(Date.now() + LOCK_PERIOD_HOURS * 3600 * 1000));
      setTimeRemaining(`${LOCK_PERIOD_HOURS}h 0m 0s`);
      setPendingStake(true);
      setJustStaked(true);
      setTimeout(() => setPendingStake(false), 10000); // 10 seconds

      toast({
        title: "Staking Successful! 🎉",
        description: `Staked ${amount} tCORE2 for ${LOCK_PERIOD_HOURS} hours. You now have a 20% discount!`,
      });
      
      // Refresh data
      await loadStakingData();
      setJustStaked(false);
      setStakeInput('0.1');
      
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
        description: `Your tokens are still locked. Unlock time: ${unlockTime?.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    try {
      const stakingService = StakingService.getInstance();
      const result = await stakingService.unstakeTokens();
      
      toast({
        title: "Unstaking Successful! 💰",
        description: `Successfully unstaked ${result?.amount} tCORE2 tokens`,
      });
      
      // Refresh data
      await loadStakingData();
      
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
  const hasActiveStake = stakingStats.hasActiveStake;
  const progressToUnlock = unlockTime ? Math.max(0, Math.min(100, ((Date.now() - (unlockTime.getTime() - LOCK_PERIOD_HOURS * 3600 * 1000)) / (LOCK_PERIOD_HOURS * 3600 * 1000)) * 100)) : 0;

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
        >
          <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-gray-300">Please connect your wallet to start staking tCORE2 tokens.</p>
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
          className="text-center"
        >
          <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Loading staking information...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              tCORE2 Staking
            </h2>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            Stake {REQUIRED_STAKE_AMOUNT} tCORE2 to unlock a {stakingStats.discountPercent}% discount on all NFT minting fees. 
            Tokens are locked for {LOCK_PERIOD_HOURS} hours.
          </p>
          
          {/* Last Updated */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <Button
              onClick={loadStakingData}
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300"
            >
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Emergency Mode Warning */}
        {stakingStats.emergencyMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-600/20 border border-red-400/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h4 className="text-red-400 font-semibold">Emergency Mode Active</h4>
                <p className="text-red-300 text-sm">Staking operations are temporarily suspended due to emergency conditions.</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Staking Interface */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Staking Analytics */}
            <StakingAnalytics walletAddress={walletAddress} />

            {/* Current Stake Status */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                  Your Stake Status
                </h3>
                {hasActiveStake && (
                  <div className="flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full border border-green-400/30">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">{stakingStats.discountPercent}% Discount Active</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-3xl font-bold text-white mb-2">
                    {hasActiveStake
                      ? REQUIRED_STAKE_AMOUNT.toFixed(2)
                      : userStakes[0]?.amount !== undefined
                        ? userStakes[0].amount.toFixed(2)
                        : '0.00'
                    }
                  </div>
                  <div className="text-gray-400 text-sm">tCORE2 Staked</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {walletBalance.toFixed(3)}
                  </div>
                  <div className="text-gray-400 text-sm">Wallet Balance</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {hasActiveStake ? '20%' : '0%'}
                  </div>
                  <div className="text-gray-400 text-sm">Minting Discount</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {LOCK_PERIOD_HOURS}
                  </div>
                  <div className="text-gray-400 text-sm">Lock Period (Hours)</div>
                </div>
              </div>

              {/* Lock Progress */}
              {hasActiveStake && unlockTime && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-3">
                    <span>Lock Progress</span>
                    <span>{progressToUnlock.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToUnlock}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-3 rounded-full ${
                        canUnstake ? 'bg-green-400' : 'bg-blue-400'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Staked: {userStakes[0]?.stakedAt?.toLocaleDateString()}</span>
                    <span>Unlock: {unlockTime.toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* Lock Status Card */}
              {hasActiveStake && (
                <div className="p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg border border-blue-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600/20 rounded-full">
                        <Clock className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {canUnstake ? 'Ready to Unstake' : 'Tokens Locked'}
                        </p>
                        <p className="text-gray-400">
                          {canUnstake 
                            ? 'Your lock period has ended. You can now unstake your tokens.'
                            : `Time remaining: ${timeRemaining}`
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !canUnstake}
                      variant={canUnstake ? "default" : "outline"}
                      size="lg"
                      className={canUnstake ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isUnstaking ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Unstaking...
                        </div>
                      ) : canUnstake ? (
                        <div className="flex items-center gap-2">
                          <Unlock className="w-4 h-4" />
                          Unstake Now
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Locked
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Staking Form */}
            {!hasActiveStake && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  Start Staking
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Stake Amount (tCORE2)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeInput}
                        onChange={(e) => setStakeInput(e.target.value)}
                        step="0.1"
                        min="0.1"
                        max="0.1"
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-lg font-mono"
                        placeholder="0.1"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        tCORE2
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Fixed stake amount: {REQUIRED_STAKE_AMOUNT} tCORE2 for {LOCK_PERIOD_HOURS} hours
                    </p>
                  </div>

                  {/* Requirements Check */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className={`w-5 h-5 ${parseFloat(stakeInput) === REQUIRED_STAKE_AMOUNT ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${parseFloat(stakeInput) === REQUIRED_STAKE_AMOUNT ? 'text-white' : 'text-gray-400'}`}>
                        Stake exactly {REQUIRED_STAKE_AMOUNT} tCORE2
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className={`w-5 h-5 ${walletBalance >= REQUIRED_STAKE_AMOUNT ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${walletBalance >= REQUIRED_STAKE_AMOUNT ? 'text-white' : 'text-gray-400'}`}>
                        Sufficient wallet balance ({walletBalance.toFixed(3)} tCORE2)
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStake}
                    disabled={isStaking || parseFloat(stakeInput) !== REQUIRED_STAKE_AMOUNT || walletBalance < REQUIRED_STAKE_AMOUNT}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    size="lg"
                  >
                    {isStaking ? (
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing Stake...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5" />
                        Stake {REQUIRED_STAKE_AMOUNT} tCORE2 for {LOCK_PERIOD_HOURS} Hours
                      </div>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Benefits & Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Staking Benefits */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Gift className="w-6 h-6 text-green-400" />
                Staking Benefits
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-600/10 rounded-lg border border-green-400/20">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">NFT Minting Discount</h4>
                    <p className="text-gray-400 text-sm">Get {stakingStats.discountPercent}% off all NFT minting fees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-400/20">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Network Support</h4>
                    <p className="text-gray-400 text-sm">Support the Core Blockchain network</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-600/10 rounded-lg border border-purple-400/20">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Simple & Secure</h4>
                    <p className="text-gray-400 text-sm">One-time stake with guaranteed returns</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Requirements */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-blue-400" />
                Requirements
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Minimum Stake</span>
                  <span className="text-white font-mono">{REQUIRED_STAKE_AMOUNT} tCORE2</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Lock Period</span>
                  <span className="text-white font-mono">{LOCK_PERIOD_HOURS} hours</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Discount</span>
                  <span className="text-green-400 font-mono">{stakingStats.discountPercent}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Staking Type</span>
                  <span className="text-white">One-time</span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                Important Notes
              </h3>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Tokens are locked for exactly {LOCK_PERIOD_HOURS} hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Cannot unstake before lock period ends</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Discount active immediately after staking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>One staking position per wallet address</span>
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

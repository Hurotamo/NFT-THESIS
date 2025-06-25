import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Coins, 
  Activity, 
  Calendar,
  Clock,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { StakingService, ContractState } from '@/services/stakingService';

interface StakingAnalyticsProps {
  walletAddress: string;
}

interface AnalyticsData {
  totalStaked: number;
  totalStakers: number;
  averageStake: number;
  discountPercent: number;
  lockPeriod: number;
  contractState: ContractState;
  userStakeAmount: number;
  userHasStake: boolean;
  timeUntilUnlock: string;
  progressToUnlock: number;
}

const StakingAnalytics: React.FC<StakingAnalyticsProps> = ({ walletAddress }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      stakingService.setWalletAddress(walletAddress);

      const [
        contractState,
        userStakeAmount,
        userHasStake,
        config,
        unlockTime
      ] = await Promise.all([
        stakingService.getContractState(),
        stakingService.getTotalStaked(),
        stakingService.hasActiveStake(),
        stakingService.getStakingConfig(),
        stakingService.getUserUnlockTime()
      ]);

      const averageStake = contractState.totalStakers > 0 
        ? contractState.totalStakedAmount / contractState.totalStakers 
        : 0;

      let timeUntilUnlock = '';
      let progressToUnlock = 0;

      if (unlockTime) {
        const now = new Date();
        const diff = unlockTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          timeUntilUnlock = `${days}d ${hours}h`;
          
          // Calculate progress (0-100%)
          const totalLockTime = 3 * 60 * 60 * 1000; // 3 hours in ms
          const elapsed = totalLockTime - diff;
          progressToUnlock = Math.max(0, Math.min(100, (elapsed / totalLockTime) * 100));
        } else {
          timeUntilUnlock = 'Ready to unstake';
          progressToUnlock = 100;
        }
      }

      setAnalytics({
        totalStaked: contractState.totalStakedAmount,
        totalStakers: contractState.totalStakers,
        averageStake,
        discountPercent: config.discountPercentage,
        lockPeriod: config.lockPeriod,
        contractState,
        userStakeAmount,
        userHasStake,
        timeUntilUnlock,
        progressToUnlock
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadAnalytics();
    }
  }, [walletAddress, loadAnalytics]);

  if (isLoading) {
    return (
      <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Staking Analytics
        </h3>
        <button
          onClick={loadAnalytics}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Staked */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.totalStaked.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">Total Staked (tCORE2)</div>
        </div>

        {/* Total Stakers */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.totalStakers}
          </div>
          <div className="text-xs text-gray-400">Active Stakers</div>
        </div>

        {/* Average Stake */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.averageStake.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Avg Stake (tCORE2)</div>
        </div>

        {/* Discount Rate */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Percent className="w-5 h-5 text-green-400" />
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.discountPercent}%
          </div>
          <div className="text-xs text-gray-400">Minting Discount</div>
        </div>
      </div>

      {/* User Status */}
      {analytics.userHasStake && (
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-4 border border-blue-400/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold mb-1">Your Stake Status</h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-300">
                  Staked: <span className="text-white font-mono">{analytics.userStakeAmount.toFixed(2)} tCORE2</span>
                </span>
                <span className="text-gray-300">
                  Time Remaining: <span className="text-white">{analytics.timeUntilUnlock}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{analytics.discountPercent}%</div>
              <div className="text-xs text-gray-400">Discount Active</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Lock Progress</span>
              <span>{analytics.progressToUnlock.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analytics.progressToUnlock}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-2 rounded-full ${
                  analytics.progressToUnlock >= 100 ? 'bg-green-400' : 'bg-blue-400'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contract Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${analytics.contractState.emergencyMode ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <span className="text-sm font-medium text-white">Emergency Mode</span>
          </div>
          <div className="text-lg font-bold text-white">
            {analytics.contractState.emergencyMode ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${analytics.contractState.paused ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <span className="text-sm font-medium text-white">Contract Status</span>
          </div>
          <div className="text-lg font-bold text-white">
            {analytics.contractState.paused ? 'Paused' : 'Active'}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Lock Period</span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1">
            <Clock className="inline w-5 h-5 text-blue-400 mr-1" /> 3 hours
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakingAnalytics; 
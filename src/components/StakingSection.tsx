
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Gift, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StakingSectionProps {
  walletAddress: string;
}

const StakingSection: React.FC<StakingSectionProps> = ({ walletAddress }) => {
  const [stakedAmount, setStakedAmount] = useState(150);
  const [stakeInput, setStakeInput] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const { toast } = useToast();

  const minimumStake = 100;
  const hasDiscount = stakedAmount >= minimumStake;
  const availableBalance = 500; // Mock balance

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

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough CORE tokens",
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);
    try {
      // Simulate staking process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStakedAmount(prev => prev + amount);
      setStakeInput('');
      toast({
        title: "Staking Successful",
        description: `Staked ${amount} CORE tokens successfully`,
      });
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: "Failed to stake tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async (amount: number) => {
    if (amount > stakedAmount) {
      toast({
        title: "Invalid Amount",
        description: "Cannot unstake more than staked amount",
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    try {
      // Simulate unstaking process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStakedAmount(prev => prev - amount);
      toast({
        title: "Unstaking Successful",
        description: `Unstaked ${amount} CORE tokens successfully`,
      });
    } catch (error) {
      toast({
        title: "Unstaking Failed",
        description: "Failed to unstake tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(false);
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
          <p className="text-gray-300">Please connect your wallet to start staking CORE tokens.</p>
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
            Stake CORE Tokens
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stake 100+ CORE tokens to unlock a 20% discount on all NFT minting fees. Earn rewards while supporting the network.
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
                    {stakedAmount.toFixed(0)}
                  </div>
                  <div className="text-gray-400">CORE Staked</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {Math.max(0, minimumStake - stakedAmount)}
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
                  <span>{Math.min(100, (stakedAmount / minimumStake) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stakedAmount / minimumStake) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      hasDiscount ? 'bg-green-400' : 'bg-blue-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Benefits Card */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                Staking Benefits
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Minting Discounts</h4>
                      <p className="text-gray-400 text-sm">Get 20% off all NFT minting fees</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Network Security</h4>
                      <p className="text-gray-400 text-sm">Help secure the Core network</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Priority Access</h4>
                      <p className="text-gray-400 text-sm">Early access to new features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Governance Rights</h4>
                      <p className="text-gray-400 text-sm">Vote on platform decisions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Staking Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Stake More */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Stake More</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Amount to Stake
                  </label>
                  <input
                    type="number"
                    value={stakeInput}
                    onChange={(e) => setStakeInput(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                  <div className="text-sm text-gray-400 mt-2">
                    Available: {availableBalance} CORE
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakeInput(amount.toString())}
                      className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      {amount} CORE
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleStake}
                  disabled={!stakeInput || isStaking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isStaking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Staking...
                    </div>
                  ) : (
                    'Stake CORE'
                  )}
                </Button>
              </div>
            </div>

            {/* Unstake */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Unstake</h4>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Current Stake: {stakedAmount} CORE
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[50, stakedAmount / 2].map((amount, index) => (
                    <button
                      key={index}
                      onClick={() => handleUnstake(amount)}
                      disabled={amount > stakedAmount || isUnstaking}
                      className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {index === 0 ? '50 CORE' : 'Half'}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => handleUnstake(stakedAmount)}
                  disabled={stakedAmount === 0 || isUnstaking}
                  variant="outline"
                  className="w-full border-red-400/50 text-red-400 hover:bg-red-400/10 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isUnstaking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Unstaking...
                    </div>
                  ) : (
                    'Unstake All'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StakingSection;

import Web3 from "web3";
import { CONTRACT_ADDRESSES } from "../config/contractAddresses";
import { useContracts } from "../hooks/useContracts";
import StakingABI from '../abis/Staking.json';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';

export interface StakePosition {
  amount: number;
  stakedAt: Date;
  unlockTime: Date;
  hasStaked: boolean;
}

export interface StakingConfig {
  minimumStake: number;
  discountPercentage: number;
  lockPeriod: number;
}

export class StakingService {
  private static instance: StakingService;
  private web3: Web3;
  private contract: Contract<AbiItem[]> | null = null;
  private walletAddress: string | null = null;

  private constructor() {
    this.web3 = new Web3(window.ethereum as typeof Web3.givenProvider);
  }

  public static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  public setWalletAddress(address: string): void {
    this.walletAddress = address;
    this.contract = new this.web3.eth.Contract(
      StakingABI.abi,
      CONTRACT_ADDRESSES.staking,
      { from: address }
    );
  }

  async stakeTokens(amount: number): Promise<StakePosition> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }

    try {
      // Check minimum stake requirement (3 tCORE2)
      const minimumStakeRaw = await this.contract?.methods.minimumStake().call();
      const minimumStake = minimumStakeRaw && typeof minimumStakeRaw === 'string' ? minimumStakeRaw : '0';
      const minimumStakeInCORE = Number(this.web3.utils.fromWei(minimumStake, 'ether'));
      
      if (amount < minimumStakeInCORE) {
        throw new Error(`Minimum stake amount is ${minimumStakeInCORE} tCORE2 for discount eligibility`);
      }

      console.log(`Attempting to stake ${amount} tCORE2 tokens`);
      console.log(`Minimum stake required: ${minimumStakeInCORE} tCORE2`);
      
      // Convert amount to wei (native token units)
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      // Call stake() with the value
      const tx = await this.contract!.methods
        .stake()
        .send({ 
          from: this.walletAddress,
          value: amountInWei,
          gas: '200000',
          maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
          maxFeePerGas: this.web3.utils.toWei('2', 'gwei')
        });

      console.log('Staking transaction:', tx);

      const stakedAt = new Date();
      const unlockTime = new Date(stakedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      return {
        amount,
        stakedAt,
        unlockTime,
        hasStaked: true
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  async unstakeTokens(): Promise<{ amount: number }> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }

    try {
      console.log('Attempting to unstake tokens');
      
      const tx = await this.contract!.methods
        .unstake()
        .send({ 
          from: this.walletAddress,
          gas: '150000',
          maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
          maxFeePerGas: this.web3.utils.toWei('2', 'gwei')
        });

      console.log('Unstaking transaction:', tx);

      // Get the user's stake amount before unstaking
      const userStake: unknown = await this.contract?.methods.stakes(this.walletAddress).call();
      const amount = isStakeObject(userStake) ? Number(this.web3.utils.fromWei(userStake.amount, 'ether')) : 0;

      return { amount };
    } catch (error) {
      console.error('Unstaking failed:', error);
      throw error;
    }
  }

  async getTotalStaked(): Promise<number> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    
    try {
      const userStake: unknown = await this.contract?.methods.stakes(this.walletAddress).call();
      if (isStakeObject(userStake)) {
        return Number(this.web3.utils.fromWei(userStake.amount, 'ether'));
      }
      return 0;
    } catch (error) {
      console.error('Failed to get total staked:', error);
      return 0;
    }
  }

  async hasDiscountEligibility(): Promise<boolean> {
    if (!this.walletAddress || !this.contract) {
      return false;
    }
    
    try {
      const discountPercent = await this.contract.methods.getDiscountPercentage(this.walletAddress).call();
      return Number(discountPercent) > 0;
    } catch (error) {
      console.error('Failed to check discount eligibility:', error);
      return false;
    }
  }

  async getUserStakes(): Promise<StakePosition[]> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    
    try {
      const userStake = (await this.contract!.methods.stakes(this.walletAddress).call()) as {
        amount?: string;
        unlockTime?: string;
        hasStaked?: boolean;
        stakeTime?: string;
        isActive?: boolean;
      } | null;
      const amount = userStake && userStake.amount ? Number(this.web3.utils.fromWei(String(userStake.amount), 'ether')) : 0;
      
      if (userStake && amount > 0 && userStake.hasStaked) {
        const unlockTime = userStake.unlockTime ? new Date(Number(userStake.unlockTime) * 1000) : new Date();
        const stakedAt = new Date(unlockTime.getTime() - 30 * 24 * 60 * 60 * 1000); // Calculate from unlock time
        
        const stake: StakePosition = {
          amount,
          stakedAt,
          unlockTime,
          hasStaked: !!userStake.hasStaked
        };
        return [stake];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user stakes:', error);
      return [];
    }
  }

  async getUserUnlockTime(): Promise<Date | null> {
    if (!this.walletAddress) {
      return null;
    }
    
    try {
      const userStake: unknown = await this.contract?.methods.stakes(this.walletAddress).call();
      if (isStakeObject(userStake)) {
        return new Date(Number(userStake.unlockTime) * 1000);
      }
      return null;
    } catch (error) {
      console.error('Error fetching unlock time:', error);
      return null;
    }
  }

  async isEligibleForDiscount(): Promise<boolean> {
    if (!this.walletAddress || !this.contract) {
      return false;
    }
    
    try {
      return await this.contract.methods.isEligibleForDiscount(this.walletAddress).call();
    } catch (error) {
      console.error('Error checking discount eligibility:', error);
      return false;
    }
  }

  async getStakingConfig(): Promise<StakingConfig> {
    try {
      const minimumStakeRaw = await this.contract?.methods.minimumStake().call();
      const minimumStake = minimumStakeRaw && typeof minimumStakeRaw === 'string' ? minimumStakeRaw : '0';
      const discountPercentRaw = await this.contract?.methods.discountPercent().call();
      const discountPercent = discountPercentRaw && typeof discountPercentRaw === 'string' ? discountPercentRaw : '0';
      return {
        minimumStake: Number(this.web3.utils.fromWei(minimumStake, 'ether')),
        discountPercentage: Number(discountPercent),
        lockPeriod: 30 // Fixed 30 days
      };
    } catch (error) {
      console.error('Failed to get staking config:', error);
      return {
        minimumStake: 3,
        discountPercentage: 20,
        lockPeriod: 30
      };
    }
  }
}

export function useStakingService() {
  const { staking } = useContracts();

  const stake = async (overrides = {}) => {
    if (!staking) throw new Error("Staking contract is not available.");
    return staking.stake(overrides);
  };

  // Add more methods as needed...
  return { stake };
}

function isStakeObject(obj: unknown): obj is { amount: string; unlockTime: string; hasStaked: boolean } {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.amount === 'string' &&
    typeof o.unlockTime === 'string' &&
    typeof o.hasStaked === 'boolean'
  );
}

import Web3 from "web3";
import contractAddresses from "../config/contractAddresses";
import StakingABI from "../../core-contract/artifacts/contracts/Staking.sol/Staking.json";

export interface StakePosition {
  amount: number;
  stakedAt: Date;
  lockPeriod: number; // in days
  unlockAt: Date;
  rewards: number;
}

export interface StakingConfig {
  minimumStake: number;
  discountThreshold: number;
  discountPercentage: number;
  lockPeriods: number[]; // Available lock periods in days
  rewardRates: Map<number, number>; // Lock period to APY mapping
}

export class StakingService {
  private static instance: StakingService;
  private web3: Web3;
  private contract: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private walletAddress: string | null = null;

  static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  constructor() {
    this.web3 = new Web3((window as { ethereum?: any }).ethereum);
    this.contract = new this.web3.eth.Contract(
      StakingABI.abi,
      contractAddresses.staking
    );
  }

  async setWalletAddress(address: string) {
    this.walletAddress = address;
  }

  async stakeTokens(
    amount: number,
    lockPeriod: number
  ): Promise<StakePosition> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }

    try {
      // Check minimum stake requirement (0.1 tCORE2)
      const minimumStake = await this.contract.methods.minimumStake().call();
      const minimumStakeInCORE = Number(this.web3.utils.fromWei(minimumStake, 'ether'));
      
      if (amount < minimumStakeInCORE) {
        throw new Error(`Minimum stake amount is ${minimumStakeInCORE} tCORE2 for discount eligibility`);
      }

      console.log(`Attempting to stake ${amount} tCORE2 tokens for ${lockPeriod} days`);
      console.log(`Minimum stake required: ${minimumStakeInCORE} tCORE2`);
      
      // Convert amount to wei (native token units)
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      // For native token staking, we only need to call stake() with the value
      // The contract will receive the native tokens via msg.value
      const tx = await this.contract.methods
        .stake()
        .send({ 
          from: this.walletAddress,
          value: amountInWei, // Send the actual tCORE2 value
          gas: 200000,
          maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
          maxFeePerGas: this.web3.utils.toWei('2', 'gwei')
        });

      console.log('Staking transaction:', tx);

      const stakedAt = new Date();
      const unlockAt = new Date(stakedAt.getTime() + lockPeriod * 24 * 60 * 60 * 1000);

      return {
        amount,
        stakedAt,
        lockPeriod,
        unlockAt,
        rewards: 0
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  async unstakeTokens(
    amount: number
  ): Promise<{ amount: number; rewards: number }> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }

    try {
      // Convert amount to wei
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      // Call the unstake function with the amount to unstake
      const tx = await this.contract.methods
        .unstake(amountInWei)
        .send({ 
          from: this.walletAddress,
          gas: 200000,
          maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
          maxFeePerGas: this.web3.utils.toWei('2', 'gwei')
        });

      console.log('Unstaking transaction:', tx);

      return { amount, rewards: 0 };
    } catch (error) {
      console.error('Unstaking failed:', error);
      throw error; // Re-throw the actual error for proper handling
    }
  }

  async getTotalStaked(): Promise<number> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    
    try {
      const totalStaked = await this.contract.methods.userStakeHistoryLatest(this.walletAddress).call();
      return Number(this.web3.utils.fromWei(totalStaked, 'ether'));
    } catch (error) {
      console.error('Failed to get total staked:', error);
      return 0;
    }
  }

  async hasDiscountEligibility(): Promise<boolean> {
    try {
      const discountPercentage = await this.getDiscountPercentage();
      return discountPercentage > 0;
    } catch (error) {
      console.error('Failed to check discount eligibility:', error);
      return false;
    }
  }

  async getDiscountPercentage(): Promise<number> {
    try {
      if (!this.walletAddress) {
        return 0;
      }
      
      const discountPercent = await this.contract.methods.getDiscountPercentage(this.walletAddress).call();
      return Number(discountPercent);
    } catch (error) {
      console.error('Failed to get discount percentage:', error);
      return 0;
    }
  }

  async getUserStakes(): Promise<StakePosition[]> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    
    try {
      const currentStake = await this.contract.methods.userStakeHistoryLatest(this.walletAddress).call();
      const stakeAmount = Number(this.web3.utils.fromWei(currentStake, 'ether'));
      
      if (stakeAmount > 0) {
        const stake: StakePosition = {
          amount: stakeAmount,
          stakedAt: new Date(), // This would come from events
          lockPeriod: 30, // This would come from events
          unlockAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // This would come from events
          rewards: 0
        };
        return [stake];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user stakes:', error);
      return [];
    }
  }

  async getUnlockableStakes(): Promise<StakePosition[]> {
    const userStakes = await this.getUserStakes();
    const now = new Date();
    return userStakes.filter(stake => now >= stake.unlockAt);
  }

  async getLockedStakes(): Promise<StakePosition[]> {
    const userStakes = await this.getUserStakes();
    const now = new Date();
    return userStakes.filter(stake => now < stake.unlockAt);
  }

  async calculatePendingRewards(): Promise<number> {
    // For now, return 0 as the contract doesn't have reward mechanism yet
    return 0;
  }

  async getStakingConfig(): Promise<StakingConfig> {
    try {
      const minimumStake = await this.contract.methods.minimumStake().call();
      const discountPercent = await this.contract.methods.discountPercent().call();
      
      return {
        minimumStake: Number(this.web3.utils.fromWei(minimumStake, 'ether')),
        discountThreshold: Number(this.web3.utils.fromWei(minimumStake, 'ether')),
        discountPercentage: Number(discountPercent),
        lockPeriods: [30, 90, 180, 365],
        rewardRates: new Map([
          [30, 5],
          [90, 8],
          [180, 12],
          [365, 15]
        ])
      };
    } catch (error) {
      console.error('Failed to get staking config:', error);
      return {
        minimumStake: 0.1,
        discountThreshold: 0.1,
        discountPercentage: 20,
        lockPeriods: [30, 90, 180, 365],
        rewardRates: new Map([
          [30, 5],
          [90, 8],
          [180, 12],
          [365, 15]
        ])
      };
    }
  }
}


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
  private stakes: Map<string, StakePosition[]> = new Map();
  private config: StakingConfig = {
    minimumStake: 10,
    discountThreshold: 100,
    discountPercentage: 20,
    lockPeriods: [30, 90, 180, 365],
    rewardRates: new Map([
      [30, 5],   // 5% APY for 30 days
      [90, 8],   // 8% APY for 90 days
      [180, 12], // 12% APY for 180 days
      [365, 18]  // 18% APY for 365 days
    ])
  };

  static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  async stakeTokens(
    walletAddress: string,
    amount: number,
    lockPeriod: number
  ): Promise<StakePosition> {
    if (amount < this.config.minimumStake) {
      throw new Error(`Minimum stake amount is ${this.config.minimumStake} CORE`);
    }

    if (!this.config.lockPeriods.includes(lockPeriod)) {
      throw new Error('Invalid lock period');
    }

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    const stakedAt = new Date();
    const unlockAt = new Date(stakedAt.getTime() + (lockPeriod * 24 * 60 * 60 * 1000));

    const position: StakePosition = {
      amount,
      stakedAt,
      lockPeriod,
      unlockAt,
      rewards: 0
    };

    const userStakes = this.stakes.get(walletAddress) || [];
    userStakes.push(position);
    this.stakes.set(walletAddress, userStakes);

    return position;
  }

  async unstakeTokens(
    walletAddress: string,
    positionIndex: number
  ): Promise<{ amount: number; rewards: number }> {
    const userStakes = this.stakes.get(walletAddress) || [];
    
    if (positionIndex >= userStakes.length) {
      throw new Error('Invalid stake position');
    }

    const position = userStakes[positionIndex];
    const now = new Date();

    if (now < position.unlockAt) {
      throw new Error('Stake is still locked');
    }

    // Calculate rewards
    const stakingDays = Math.floor((now.getTime() - position.stakedAt.getTime()) / (24 * 60 * 60 * 1000));
    const apy = this.config.rewardRates.get(position.lockPeriod) || 0;
    const rewards = (position.amount * apy / 100) * (stakingDays / 365);

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Remove position
    userStakes.splice(positionIndex, 1);
    this.stakes.set(walletAddress, userStakes);

    return {
      amount: position.amount,
      rewards
    };
  }

  getTotalStaked(walletAddress: string): number {
    const userStakes = this.stakes.get(walletAddress) || [];
    return userStakes.reduce((total, stake) => total + stake.amount, 0);
  }

  hasDiscountEligibility(walletAddress: string): boolean {
    return this.getTotalStaked(walletAddress) >= this.config.discountThreshold;
  }

  getDiscountPercentage(walletAddress: string): number {
    return this.hasDiscountEligibility(walletAddress) ? this.config.discountPercentage : 0;
  }

  getUserStakes(walletAddress: string): StakePosition[] {
    return this.stakes.get(walletAddress) || [];
  }

  getUnlockableStakes(walletAddress: string): StakePosition[] {
    const userStakes = this.getUserStakes(walletAddress);
    const now = new Date();
    return userStakes.filter(stake => now >= stake.unlockAt);
  }

  getLockedStakes(walletAddress: string): StakePosition[] {
    const userStakes = this.getUserStakes(walletAddress);
    const now = new Date();
    return userStakes.filter(stake => now < stake.unlockAt);
  }

  calculatePendingRewards(walletAddress: string): number {
    const userStakes = this.getUserStakes(walletAddress);
    const now = new Date();
    
    return userStakes.reduce((totalRewards, stake) => {
      const stakingDays = Math.floor((now.getTime() - stake.stakedAt.getTime()) / (24 * 60 * 60 * 1000));
      const apy = this.config.rewardRates.get(stake.lockPeriod) || 0;
      const rewards = (stake.amount * apy / 100) * (stakingDays / 365);
      return totalRewards + rewards;
    }, 0);
  }
}

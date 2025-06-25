import Web3 from "web3";
import { CONTRACT_ADDRESSES } from "../config/contractAddresses";
import { useContracts } from "../hooks/useContracts";
import StakingABI from '../abis/Staking.json';
import type { Contract, EventLog } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';

export interface StakePosition {
  amount: number;
  stakedAt: Date;
  unlockTime: Date;
  hasStaked: boolean;
  isActive: boolean;
}

export interface StakingConfig {
  minimumStake: number;
  discountPercentage: number;
  lockPeriod: number;
  requiredStakeAmount: number;
}

export interface ContractState {
  emergencyMode: boolean;
  paused: boolean;
  totalStakedAmount: number;
  totalStakers: number;
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
    if (!this.walletAddress || !this.contract) {
      throw new Error("Wallet address not set or contract not initialized");
    }

    try {
      // Check contract state first
      const contractState = await this.getContractState();
      if (contractState.emergencyMode) {
        throw new Error("Contract is in emergency mode. Staking is temporarily disabled.");
      }
      if (contractState.paused) {
        throw new Error("Contract is paused. Staking is temporarily disabled.");
      }

      // Check if user already has an active stake
      const hasActiveStake = await this.hasActiveStake();
      if (hasActiveStake) {
        throw new Error("You already have an active stake. Cannot stake again.");
      }

      // Validate stake amount (must be exactly 0.1 tCORE2)
      const requiredAmount = 0.1; // 0.1 tCORE2 as per contract
      if (amount !== requiredAmount) {
        throw new Error(`Must stake exactly ${requiredAmount} tCORE2`);
      }

      console.log(`Attempting to stake ${amount} tCORE2 tokens`);
      
      // Convert amount to wei (native token units)
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      // Call stake() with the value
      const tx = await this.contract.methods
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
      const unlockTime = new Date(stakedAt.getTime() + 3 * 60 * 60 * 1000); // 3 hours

      return {
        amount,
        stakedAt,
        unlockTime,
        hasStaked: true,
        isActive: true
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  async unstakeTokens(): Promise<{ amount: number }> {
    if (!this.walletAddress || !this.contract) {
      throw new Error("Wallet address not set or contract not initialized");
    }

    try {
      // Check if user has an active stake
      const hasActiveStake = await this.hasActiveStake();
      if (!hasActiveStake) {
        throw new Error("No active stake found to unstake.");
      }

      // Check if lock period has ended
      const userStake = await this.getUserStakeInfo();
      if (userStake && userStake.isActive) {
        const unlockTime = new Date(userStake.unlockTime * 1000);
        if (new Date() < unlockTime) {
          throw new Error(`Tokens are still locked. Unlock time: ${unlockTime.toLocaleString()}`);
        }
      }

      console.log('Attempting to unstake tokens');
      
      const tx = await this.contract.methods
        .unstake()
        .send({ 
          from: this.walletAddress,
          gas: '150000',
          maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
          maxFeePerGas: this.web3.utils.toWei('2', 'gwei')
        });

      console.log('Unstaking transaction:', tx);

      // Get the user's stake amount before unstaking
      const userStakeInfo = await this.getUserStakeInfo();
      const amount = userStakeInfo ? Number(this.web3.utils.fromWei(userStakeInfo.amount, 'ether')) : 0;

      return { amount };
    } catch (error) {
      console.error('Unstaking failed:', error);
      throw error;
    }
  }

  async getTotalStaked(): Promise<number> {
    if (!this.walletAddress || !this.contract) {
      return 0;
    }
    
    try {
      const userStake = await this.getUserStakeInfo();
      if (userStake && userStake.isActive) {
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

  async hasActiveStake(): Promise<boolean> {
    if (!this.walletAddress || !this.contract) {
      return false;
    }
    
    try {
      return await this.contract.methods.hasActiveStake(this.walletAddress).call();
    } catch (error) {
      console.error('Failed to check active stake:', error);
      return false;
    }
  }

  async getUserStakes(): Promise<StakePosition[]> {
    if (!this.walletAddress || !this.contract) {
      return [];
    }
    
    try {
      const userStake = await this.getUserStakeInfo();
      
      if (userStake && Number(userStake.amount) > 0 && userStake.hasStaked && userStake.isActive) {
        const amount = Number(this.web3.utils.fromWei(userStake.amount, 'ether'));
        const unlockTime = new Date(userStake.unlockTime * 1000);
        const stakedAt = new Date(unlockTime.getTime() - 3 * 60 * 60 * 1000); // Calculate from unlock time (3 hours)
        
        const stake: StakePosition = {
          amount,
          stakedAt,
          unlockTime,
          hasStaked: userStake.hasStaked,
          isActive: userStake.isActive
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
    if (!this.walletAddress || !this.contract) {
      return null;
    }
    
    try {
      const userStake = await this.getUserStakeInfo();
      if (userStake && userStake.unlockTime) {
        return new Date(userStake.unlockTime * 1000);
      }
      return null;
    } catch (error) {
      console.error('Error fetching unlock time:', error);
      return null;
    }
  }

  async getUserStakeInfo(): Promise<{
    amount: string;
    unlockTime: number;
    hasStaked: boolean;
    stakeTime: number;
    isActive: boolean;
  } | null> {
    if (!this.walletAddress || !this.contract) {
      return null;
    }
    
    try {
      const userStake = await this.contract.methods.getUserStakeInfo(this.walletAddress).call() as {
        amount: string;
        unlockTime: string;
        hasStaked: boolean;
        stakeTime: string;
        isActive: boolean;
      };
      
      return {
        amount: userStake.amount,
        unlockTime: Number(userStake.unlockTime),
        hasStaked: userStake.hasStaked,
        stakeTime: Number(userStake.stakeTime),
        isActive: userStake.isActive
      };
    } catch (error) {
      console.error('Error fetching user stake info:', error);
      return null;
    }
  }

  async getContractState(): Promise<ContractState> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const [emergencyMode, paused, totalStakedAmount, totalStakers] = await Promise.all([
        this.contract.methods.emergencyMode().call(),
        this.contract.methods.paused().call(),
        this.contract.methods.getTotalStakedAmount().call(),
        this.contract.methods.getTotalStakers().call()
      ]);

      return {
        emergencyMode: Boolean(emergencyMode),
        paused: Boolean(paused),
        totalStakedAmount: Number(this.web3.utils.fromWei(String(totalStakedAmount), 'ether')),
        totalStakers: Number(totalStakers)
      };
    } catch (error) {
      console.error('Failed to get contract state:', error);
      return {
        emergencyMode: false,
        paused: false,
        totalStakedAmount: 0,
        totalStakers: 0
      };
    }
  }

  async isEligibleForDiscount(): Promise<boolean> {
    if (!this.walletAddress || !this.contract) {
      return false;
    }
    
    try {
      return await this.contract.methods.hasActiveStake(this.walletAddress).call();
    } catch (error) {
      console.error('Error checking discount eligibility:', error);
      return false;
    }
  }

  async getStakingConfig(): Promise<StakingConfig> {
    if (!this.contract) {
      return {
        minimumStake: 0.1,
        discountPercentage: 20,
        lockPeriod: 3,
        requiredStakeAmount: 0.1
      };
    }
    
    try {
      const [discountPercentRaw, totalStakedAmount, totalStakers] = await Promise.all([
        this.contract.methods.getCurrentDiscountPercent().call(),
        this.contract.methods.getTotalStakedAmount().call(),
        this.contract.methods.getTotalStakers().call()
      ]);
      
      return {
        minimumStake: 0.1, // Fixed as per contract
        discountPercentage: Number(discountPercentRaw),
        lockPeriod: 3, // Fixed 3 hours
        requiredStakeAmount: 0.1 // Fixed as per contract
      };
    } catch (error) {
      console.error('Failed to get staking config:', error);
      return {
        minimumStake: 0.1,
        discountPercentage: 20,
        lockPeriod: 3,
        requiredStakeAmount: 0.1
      };
    }
  }

  async isBlacklisted(): Promise<boolean> {
    if (!this.walletAddress || !this.contract) {
      return false;
    }
    
    try {
      return await this.contract.methods.isBlacklisted(this.walletAddress).call();
    } catch (error) {
      console.error('Error checking blacklist status:', error);
      return false;
    }
  }

  public async getOwner(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.methods.owner().call();
  }

  public async getGovernanceContract(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.methods.getGovernanceContract().call();
  }

  public async hasConfirmedAnyOperation(address: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    // Get all past OperationProposed events
    const events: EventLog[] = await this.contract.getPastEvents('OperationProposed', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    for (const event of events) {
      const operationHash = event.returnValues.operationHash;
      const confirmed = await this.contract.methods.hasConfirmed(operationHash, address).call();
      if (confirmed) return true;
    }
    return false;
  }

  public getContract(): Contract<AbiItem[]> | null {
    return this.contract;
  }

  public async setDiscountPercent(percent: number): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.setDiscountPercent(percent).send({ from: this.walletAddress });
  }

  public async blacklistAddress(address: string): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.blacklistAddress(address).send({ from: this.walletAddress });
  }

  public async unblacklistAddress(address: string): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.unblacklistAddress(address).send({ from: this.walletAddress });
  }

  public async batchStake(addresses: string[]): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    const amounts = addresses.map(() => this.web3.utils.toWei('0.1', 'ether'));
    await this.contract.methods.batchStake(addresses, amounts).send({ from: this.walletAddress });
  }

  public async batchUnstake(addresses: string[]): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.batchUnstake(addresses).send({ from: this.walletAddress });
  }

  public async activateEmergencyMode(): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.activateEmergencyMode().send({ from: this.walletAddress });
  }

  public async deactivateEmergencyMode(): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.deactivateEmergencyMode().send({ from: this.walletAddress });
  }

  public async pauseContract(): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.pause().send({ from: this.walletAddress });
  }

  public async unpauseContract(): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.unpause().send({ from: this.walletAddress });
  }

  /**
   * Fetch all admin action logs (discount, emergency, blacklist, pause, etc.)
   */
  public async getAdminActionLogs(): Promise<EventLog[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    const eventNames = [
      'DiscountParamsUpdated',
      'EmergencyModeActivated',
      'EmergencyModeDeactivated',
      'AddressBlacklisted',
      'AddressUnblacklisted',
      'Paused',
      'Unpaused',
    ];
    let logs: any[] = [];
    for (const eventName of eventNames) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events = await (this.contract as any).getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: 'latest',
      });
      logs = logs.concat(events);
    }
    // Only keep EventLog objects
    logs = logs.filter(e => typeof e === 'object' && e !== null && 'event' in e);
    logs.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0)); // Most recent first
    return logs;
  }

  public async emergencyRecoverTokens(to: string): Promise<void> {
    if (!this.walletAddress || !this.contract) throw new Error('Wallet address not set or contract not initialized');
    await this.contract.methods.emergencyRecoverTokens(to).send({ from: this.walletAddress });
  }
}

export function useStakingService() {
  const { staking } = useContracts();

  const stake = async (overrides = {}) => {
    if (!staking) throw new Error("Staking contract is not available.");
    return staking.stake(overrides);
  };

  // Add admin methods
  const emergencyRecoverTokens = async (to: string) => {
    const service = StakingService.getInstance();
    await service.setWalletAddress((window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress || "");
    return service.emergencyRecoverTokens(to);
  };
  const pauseContract = async () => {
    const service = StakingService.getInstance();
    await service.setWalletAddress((window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress || "");
    return service.pauseContract();
  };
  const unpauseContract = async () => {
    const service = StakingService.getInstance();
    await service.setWalletAddress((window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress || "");
    return service.unpauseContract();
  };
  const activateEmergencyMode = async () => {
    const service = StakingService.getInstance();
    await service.setWalletAddress((window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress || "");
    return service.activateEmergencyMode();
  };
  const deactivateEmergencyMode = async () => {
    const service = StakingService.getInstance();
    await service.setWalletAddress((window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress || "");
    return service.deactivateEmergencyMode();
  };

  // Add more methods as needed...
  return { stake, emergencyRecoverTokens, pauseContract, unpauseContract, activateEmergencyMode, deactivateEmergencyMode };
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

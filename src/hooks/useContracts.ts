import { useMemo } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from "ethers";
import ThesisNFTABI from "../abis/ThesisNFT.json";
import AuctionManagerABI from "../abis/AuctionManager.json";
import StakingABI from "../abis/Staking.json";
import FileRegistryABI from "../abis/FileRegistry.json";
import GovernanceABI from "../abis/Governance.json";
import ThesisAuctionABI from "../abis/ThesisAuction.json";
import { CONTRACT_ADDRESSES } from "../config/contractAddresses";
import { AuctionService, AuctionConfig } from '../services/auctionService';
import { StakingService } from '../services/stakingService';

export function useContracts() {
  const { currentAccount, isConnected } = useWeb3();

  return useMemo(() => {
    if (!window.ethereum || !currentAccount) return {};
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const auctionService = AuctionService.getInstance();
    const stakingService = StakingService.getInstance();
    auctionService.setWalletAddress(currentAccount);
    stakingService.setWalletAddress(currentAccount);
    return {
      thesisNFT: new ethers.Contract(CONTRACT_ADDRESSES.thesisNFT, ThesisNFTABI.abi, signer),
      auctionManager: new ethers.Contract(CONTRACT_ADDRESSES.auctionManager, AuctionManagerABI.abi, signer),
      staking: new ethers.Contract(CONTRACT_ADDRESSES.staking, StakingABI.abi, signer),
      fileRegistry: new ethers.Contract(CONTRACT_ADDRESSES.fileRegistry, FileRegistryABI.abi, signer),
      governance: new ethers.Contract(CONTRACT_ADDRESSES.governance, GovernanceABI.abi, signer),
      thesisAuction: new ethers.Contract(CONTRACT_ADDRESSES.thesisAuction, ThesisAuctionABI.abi, signer),
      // AuctionService methods for UI
      getActiveAuctions: () => auctionService.getActiveAuctions(),
      getUserBids: () => auctionService.getUserBids(currentAccount),
      placeBid: (auctionId: string, amount: number) => auctionService.placeBid(auctionId, currentAccount, amount),
      createAuction: (nftTokenId: string, config: AuctionConfig) => auctionService.createAuction(nftTokenId, currentAccount, config),
      isConnected,
      currentAccount,
      getTotalStaked: () => stakingService.getTotalStaked(),
      hasDiscountEligibility: () => stakingService.hasDiscountEligibility(),
    };
  }, [currentAccount, isConnected]);
} 
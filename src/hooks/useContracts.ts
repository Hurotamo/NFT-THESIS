import { useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { NFTContractService, NFTMetadata, MintedNFT } from '@/services/nftContractService';
import { StakingService, StakePosition } from '@/services/stakingService';
import { AuctionService, Auction, AuctionConfig, Bid } from '@/services/auctionService';

export const useContracts = () => {
  const { currentAccount, isConnected, contracts } = useWeb3();
  const { toast } = useToast();

  // NFT Contract Operations
  const mintNFT = useCallback(async (
    thesisId: string,
    metadata: NFTMetadata,
    stakedAmount: number = 0
  ): Promise<MintedNFT | null> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      });
      return null;
    }

    try {
      const nftService = NFTContractService.getInstance();
      await nftService.setWalletAddress(currentAccount);
      
      const mintedNFT = await nftService.mintNFT(thesisId, metadata, stakedAmount);
      
      toast({
        title: "NFT Minted Successfully!",
        description: `NFT minted for "${metadata.title}"`,
      });
      
      return mintedNFT;
    } catch (error: unknown) {
      console.error('Minting failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to mint NFT. Please try again.";
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [isConnected, currentAccount, toast]);

  const getUserNFTs = useCallback(async (): Promise<MintedNFT[]> => {
    if (!isConnected || !currentAccount) {
      return [];
    }

    try {
      const nftService = NFTContractService.getInstance();
      await nftService.setWalletAddress(currentAccount);
      return await nftService.getUserMintedNFTs();
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      return [];
    }
  }, [isConnected, currentAccount]);

  const unblurNFT = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to unblur NFTs",
        variant: "destructive",
      });
      return false;
    }

    try {
      const nftService = NFTContractService.getInstance();
      await nftService.setWalletAddress(currentAccount);
      
      const success = await nftService.unblurNFT(tokenId);
      
      if (success) {
        toast({
          title: "NFT Unblurred",
          description: "The NFT content is now visible",
        });
      }
      
      return success;
    } catch (error: unknown) {
      console.error('Unblur failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to unblur NFT";
      toast({
        title: "Unblur Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [isConnected, currentAccount, toast]);

  // Staking Contract Operations
  const stakeTokens = useCallback(async (
    amount: number,
    lockPeriod: number
  ): Promise<StakePosition | null> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to stake tokens",
        variant: "destructive",
      });
      return null;
    }

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);
      
      const position = await stakingService.stakeTokens(amount, lockPeriod);
      
      toast({
        title: "Staking Successful",
        description: `Staked ${amount} CORE tokens for ${lockPeriod} days`,
      });
      
      return position;
    } catch (error: unknown) {
      console.error('Staking failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to stake tokens";
      toast({
        title: "Staking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [isConnected, currentAccount, toast]);

  const unstakeTokens = useCallback(async (
    amount: number
  ): Promise<{ amount: number; rewards: number } | null> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to unstake tokens",
        variant: "destructive",
      });
      return null;
    }

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);
      
      const result = await stakingService.unstakeTokens(amount);
      
      toast({
        title: "Unstaking Successful",
        description: `Unstaked ${result.amount} CORE tokens with ${result.rewards} rewards`,
      });
      
      return result;
    } catch (error: unknown) {
      console.error('Unstaking failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to unstake tokens";
      toast({
        title: "Unstaking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [isConnected, currentAccount, toast]);

  const getTotalStaked = useCallback(async (): Promise<number> => {
    if (!isConnected || !currentAccount) {
      return 0;
    }

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);
      return await stakingService.getTotalStaked();
    } catch (error) {
      console.error('Failed to get total staked:', error);
      return 0;
    }
  }, [isConnected, currentAccount]);

  const hasDiscountEligibility = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !currentAccount) {
      return false;
    }

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);
      return await stakingService.hasDiscountEligibility();
    } catch (error) {
      console.error('Failed to check discount eligibility:', error);
      return false;
    }
  }, [isConnected, currentAccount]);

  const getUserStakes = useCallback(async (): Promise<StakePosition[]> => {
    if (!isConnected || !currentAccount) {
      return [];
    }

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);
      return await stakingService.getUserStakes();
    } catch (error) {
      console.error('Failed to get user stakes:', error);
      return [];
    }
  }, [isConnected, currentAccount]);

  // Auction Contract Operations
  const createAuction = useCallback(async (
    nftTokenId: string,
    config: AuctionConfig
  ): Promise<string | null> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create auctions",
        variant: "destructive",
      });
      return null;
    }

    try {
      const auctionService = AuctionService.getInstance();
      await auctionService.setWalletAddress(currentAccount);
      
      const auctionId = await auctionService.createAuction(nftTokenId, currentAccount, config);
      
      toast({
        title: "Auction Created",
        description: "Your auction has been created successfully",
      });
      
      return auctionId;
    } catch (error: unknown) {
      console.error('Auction creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create auction";
      toast({
        title: "Auction Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [isConnected, currentAccount, toast]);

  const placeBid = useCallback(async (
    auctionId: string,
    amount: number
  ): Promise<boolean> => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place bids",
        variant: "destructive",
      });
      return false;
    }

    try {
      const auctionService = AuctionService.getInstance();
      await auctionService.setWalletAddress(currentAccount);
      
      const success = await auctionService.placeBid(auctionId, currentAccount, amount);
      
      if (success) {
        toast({
          title: "Bid Placed",
          description: `Bid of ${amount} CORE placed successfully`,
        });
      }
      
      return success;
    } catch (error: unknown) {
      console.error('Bid placement failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place bid";
      toast({
        title: "Bid Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [isConnected, currentAccount, toast]);

  const getActiveAuctions = useCallback((): Auction[] => {
    const auctionService = AuctionService.getInstance();
    return auctionService.getActiveAuctions();
  }, []);

  const getUserBids = useCallback((): { auctionId: string; bid: Bid }[] => {
    if (!currentAccount) return [];
    
    const auctionService = AuctionService.getInstance();
    return auctionService.getUserBids(currentAccount);
  }, [currentAccount]);

  return {
    // NFT operations
    mintNFT,
    getUserNFTs,
    unblurNFT,
    
    // Staking operations
    stakeTokens,
    unstakeTokens,
    getTotalStaked,
    hasDiscountEligibility,
    getUserStakes,
    
    // Auction operations
    createAuction,
    placeBid,
    getActiveAuctions,
    getUserBids,
    
    // Contract state
    contracts,
    isConnected,
    currentAccount,
  };
}; 
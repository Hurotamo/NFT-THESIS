
export interface NFTMetadata {
  title: string;
  author: string;
  university: string;
  year: number;
  field: string;
  description: string;
  ipfsHash: string;
  tags: string[];
}

export interface NFTMintingConfig {
  maxSupply: number;
  platformFeePercentage: number; // Platform fee (5%)
  authorRoyaltyPercentage: number; // Author royalty (10%)
  mintPrice: number;
  isBlurred: boolean;
  introOnly: boolean;
}

export interface MintedNFT {
  tokenId: string;
  owner: string;
  metadata: NFTMetadata;
  isBlurred: boolean;
  mintedAt: Date;
  transactionHash: string;
}

export class NFTContractService {
  private static instance: NFTContractService;
  private mintedNFTs: Map<string, MintedNFT[]> = new Map();
  private nftConfigs: Map<string, NFTMintingConfig> = new Map();
  private walletMintCounts: Map<string, Set<string>> = new Map();

  static getInstance(): NFTContractService {
    if (!NFTContractService.instance) {
      NFTContractService.instance = new NFTContractService();
    }
    return NFTContractService.instance;
  }

  setNFTConfig(thesisId: string, config: NFTMintingConfig): void {
    this.nftConfigs.set(thesisId, config);
  }

  getNFTConfig(thesisId: string): NFTMintingConfig | null {
    return this.nftConfigs.get(thesisId) || null;
  }

  canUserMint(walletAddress: string, thesisId: string): boolean {
    const userMints = this.walletMintCounts.get(walletAddress) || new Set();
    return !userMints.has(thesisId);
  }

  getMintedCount(thesisId: string): number {
    const mints = this.mintedNFTs.get(thesisId) || [];
    return mints.length;
  }

  async mintNFT(
    thesisId: string,
    walletAddress: string,
    metadata: NFTMetadata,
    stakedAmount: number = 0
  ): Promise<MintedNFT> {
    // Check if user can mint (1 per wallet per thesis)
    if (!this.canUserMint(walletAddress, thesisId)) {
      throw new Error('You can only mint 1 NFT per thesis per wallet');
    }

    const config = this.getNFTConfig(thesisId);
    if (!config) {
      throw new Error('NFT minting not configured for this thesis');
    }

    const currentSupply = this.getMintedCount(thesisId);
    if (currentSupply >= config.maxSupply) {
      throw new Error('Maximum NFT supply reached for this thesis');
    }

    // Calculate fees with staking discount
    const hasStakingDiscount = stakedAmount >= 100;
    const discountRate = hasStakingDiscount ? 0.2 : 0;
    const finalMintPrice = config.mintPrice * (1 - discountRate);

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tokenId = `${thesisId}_${currentSupply + 1}`;
    const mintedNFT: MintedNFT = {
      tokenId,
      owner: walletAddress,
      metadata,
      isBlurred: true, // NFT is blurred until fully minted
      mintedAt: new Date(),
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };

    // Record the mint
    const existingMints = this.mintedNFTs.get(thesisId) || [];
    this.mintedNFTs.set(thesisId, [...existingMints, mintedNFT]);

    // Track user mint for this thesis
    const userMints = this.walletMintCounts.get(walletAddress) || new Set();
    userMints.add(thesisId);
    this.walletMintCounts.set(walletAddress, userMints);

    return mintedNFT;
  }

  getUserMintedNFTs(walletAddress: string): MintedNFT[] {
    const allNFTs: MintedNFT[] = [];
    this.mintedNFTs.forEach((nfts) => {
      const userNFTs = nfts.filter(nft => nft.owner === walletAddress);
      allNFTs.push(...userNFTs);
    });
    return allNFTs;
  }

  unblurNFT(tokenId: string, ownerAddress: string): boolean {
    for (const [thesisId, nfts] of this.mintedNFTs.entries()) {
      const nftIndex = nfts.findIndex(nft => nft.tokenId === tokenId && nft.owner === ownerAddress);
      if (nftIndex !== -1) {
        nfts[nftIndex].isBlurred = false;
        return true;
      }
    }
    return false;
  }
}

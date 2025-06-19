import { ethers } from "ethers";
import contractAddresses from "@/config/contractAddresses";
import ThesisNFTABI from "../../core-contract/artifacts/contracts/Thesis-NFT.sol/ThesisNFT.json";

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
  blurredContent?: string;
}

export class NFTContractService {
  private static instance: NFTContractService;
  private contract: ethers.Contract | null;
  private walletAddress: string | null = null;
  private mintedNFTs: Map<string, MintedNFT[]> = new Map();
  private nftConfigs: Map<string, NFTMintingConfig> = new Map();
  private walletMintCounts: Map<string, Set<string>> = new Map();

  static getInstance(): NFTContractService {
    if (!NFTContractService.instance) {
      NFTContractService.instance = new NFTContractService();
    }
    return NFTContractService.instance;
  }

  async setWalletAddress(walletAddress: string) {
    this.walletAddress = walletAddress;
    // Set up ethers.js contract instance
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // Import the ABI and contract address as needed
      const ThesisNFTAbi = (await import('../../core-contract/artifacts/contracts/Thesis-NFT.sol/ThesisNFT.json')).default.abi;
      const contractAddress = "0x660C6Bc195a5B12CF453FaCC4AbA419216C6fB24";
      this.contract = new ethers.Contract(contractAddress, ThesisNFTAbi, signer);
    }
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
    metadata: NFTMetadata,
    stakedAmount: number = 0
  ): Promise<MintedNFT> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    // Get the mint price from the contract
    const mintPrice = await this.contract.price();
    // Calculate discount if applicable
    const hasStakingDiscount = stakedAmount >= 3; // 3 tCORE2 minimum for discount
    const discountRate = hasStakingDiscount ? 0.2 : 0;
    const effectivePrice = mintPrice.mul(ethers.BigNumber.from(100 - discountRate * 100)).div(100);

    // Add platform fee (20%)
    const platformFee = effectivePrice.mul(20).div(100);
    const totalPrice = effectivePrice.add(platformFee);

    // Convert totalPrice to string in ether and then to WEI
    const totalPriceInWei = ethers.utils.parseEther(ethers.utils.formatEther(totalPrice));

    // Call the mint function on the contract
    const tx = await this.contract.mint(1, { value: totalPriceInWei });
    const receipt = await tx.wait();
    const transferEvent = receipt.events.find((e: ethers.Event) => e.event === 'Transfer');
    const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : '';

    const mintedNFT: MintedNFT = {
      tokenId,
      owner: this.walletAddress,
      metadata,
      isBlurred: true,
      mintedAt: new Date(),
      transactionHash: tx.hash,
    };

    // Record the mint
    const existingMints = this.mintedNFTs.get(thesisId) || [];
    this.mintedNFTs.set(thesisId, [...existingMints, mintedNFT]);

    // Track user mint for this thesis
    const userMints = this.walletMintCounts.get(this.walletAddress) || new Set();
    userMints.add(thesisId);
    this.walletMintCounts.set(this.walletAddress, userMints);

    return mintedNFT;
  }

  async getUserMintedNFTs(): Promise<MintedNFT[]> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    // Fetch the number of NFTs owned by the user
    const balance: number = (await this.contract.balanceOf(this.walletAddress)).toNumber();
    const nfts: MintedNFT[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = (await this.contract.tokenOfOwnerByIndex(this.walletAddress, i)).toString();
      // Optionally fetch metadata from tokenURI or your backend here
      // Simulate file type for demo (should fetch real type from metadata)
      const fileType = 'application/pdf'; // Replace with real type if available
      const isBlurred = true; // Replace with real logic
      nfts.push({
        tokenId,
        owner: this.walletAddress,
        metadata: {
          title: '',
          author: '',
          university: '',
          year: 0,
          field: '',
          description: '',
          ipfsHash: '',
          tags: []
        },
        isBlurred,
        mintedAt: new Date(),
        transactionHash: '',
        blurredContent: isBlurred ? this.getBlurredFileContent(fileType) : undefined
      });
    }
    return nfts;
  }

  async unblurNFT(tokenId: string): Promise<boolean> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }

    // Call unblur function on the contract if exists
    // Placeholder: return true for now
    return true;
  }

  getBlurredFileContent(fileType: string): string {
    if (fileType.startsWith('text/')) {
      return 'This file is blurred. Mint the NFT to unlock the full content.';
    }
    if (fileType === 'application/pdf') {
      return 'This PDF is blurred. Mint the NFT to unlock the full document.';
    }
    return 'This file is blurred. Mint the NFT to unlock.';
  }
}

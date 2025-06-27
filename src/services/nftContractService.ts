import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/config/contractAddresses";
import { useContracts } from "@/hooks/useContracts";
import type { EventLog } from 'web3-eth-contract';

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
  cost?: number;
}

export class NFTContractService {
  private static instance: NFTContractService;
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.Web3Provider | null = null;
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
      this.provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const signer = this.provider.getSigner();
      // Import the ABI and contract address as needed
      const ThesisNFTAbi = (await import('@/abis/ThesisNFT.json')).default.abi;
      this.contract = new ethers.Contract(CONTRACT_ADDRESSES.thesisNFT, ThesisNFTAbi, signer);
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

  /**
   * Upload a file to the NFT contract, enforcing file size and fee logic on-chain, and set minting price
   * @param ipfsHash The IPFS hash of the uploaded file
   * @param fileSize The file size in bytes
   * @param mintPrice The minting price per NFT in tCORE2 (as string, will be converted to wei)
   * @returns The transaction receipt
   */
  async uploadFileToContract(ipfsHash: string, fileSize: number, mintPrice: string): Promise<ethers.providers.TransactionReceipt> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    // Calculate required fee (in ETH)
    const sizeInMB = fileSize / (1024 * 1024);
    let requiredFee = 0;
    if (sizeInMB >= 1 && sizeInMB <= 15) requiredFee = 0.01;
    else if (sizeInMB > 15 && sizeInMB <= 45) requiredFee = 0.03;
    else if (sizeInMB > 45 && sizeInMB <= 60) requiredFee = 0.06;
    else if (sizeInMB > 60 && sizeInMB <= 80) requiredFee = 0.09;
    else throw new Error('File size must be between 1MB and 80MB.');
    const value = ethers.utils.parseEther(requiredFee.toString());
    const mintPriceWei = ethers.utils.parseEther(mintPrice);
    // Call the contract function
    const tx = await this.contract.uploadFile(ipfsHash, fileSize, mintPriceWei, { value });
    return await tx.wait();
  }

  /**
   * Mint an NFT for a given uploader, using their mint price and a per-token URI
   * @param uploader The uploader's address
   * @param tokenURI The IPFS metadata URI for this NFT
   * @param stakedAmount The staked amount for discount (optional)
   * @returns The transaction receipt
   */
  async mintNFTForUploader(uploader: string, tokenURI: string, stakedAmount: number = 0): Promise<ethers.providers.TransactionReceipt> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    // Get the uploader's mint price from the contract
    const mintPriceWei = await this.contract.getMintPrice(uploader);
    // Calculate discount if applicable
    const hasStakingDiscount = stakedAmount >= 3; // 3 tCORE2 minimum for discount
    const discountRate = hasStakingDiscount ? 0.2 : 0;
    const effectivePrice = mintPriceWei.mul(ethers.BigNumber.from(100 - discountRate * 100)).div(100);
    // Add platform fee (20%)
    const platformFee = effectivePrice.mul(20).div(100);
    const totalPrice = effectivePrice.add(platformFee);
    // Call the mintWithURI function on the contract
    const tx = await this.contract.mintWithURI(uploader, 1, tokenURI, { value: totalPrice });
    return await tx.wait();
  }

  /**
   * Get the mint price for a given uploader
   * @param uploader The uploader's address
   * @returns The mint price in wei (as BigNumber)
   */
  async getMintPriceForUploader(uploader: string): Promise<ethers.BigNumber> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    return await this.contract.getMintPrice(uploader);
  }

  /**
   * Fetch uploaded file info for a user from the contract
   * @param userAddress The address of the user
   * @returns { ipfsHash: string, fileSize: number, uploader: string }
   */
  async getUploadedFileForUser(userAddress: string): Promise<{ ipfsHash: string; fileSize: number; uploader: string }> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    const [ipfsHash, fileSize, uploader] = await this.contract.getUploadedFile(userAddress);
    return { ipfsHash, fileSize: Number(fileSize), uploader };
  }

  /**
   * Get all uploaded files from the smart contract by querying events
   * @returns Array of uploaded file information
   */
  async getAllUploadedFiles(): Promise<Array<{
    ipfsHash: string;
    fileSize: number;
    uploader: string;
    feePaid: string;
    mintPrice: string;
    blockNumber: number;
  }>> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // Get the latest block number
      const latestBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Scan last 10000 blocks

      // Query FileUploaded events
      const events: EventLog[] = await this.contract.getPastEvents('FileUploaded', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      // Process events to extract file information
      const uploadedFiles = events
        .map((event: EventLog) => {
          if (!event.returnValues) {
            return null;
          }
          const { uploader, ipfsHash, fileSize, feePaid, mintPrice } = event.returnValues;
          return {
            ipfsHash: String(ipfsHash),
            fileSize: Number(fileSize),
            uploader: String(uploader),
            feePaid: String(feePaid),
            mintPrice: String(mintPrice),
            blockNumber: Number(event.blockNumber),
          };
        })
        .filter((file): file is {
          ipfsHash: string;
          fileSize: number;
          uploader: string;
          feePaid: string;
          mintPrice: string;
          blockNumber: number;
        } => file !== null);

      return uploadedFiles;
    } catch (error) {
      console.error('Error fetching uploaded files from contract:', error);
      throw new Error('Failed to fetch uploaded files from contract');
    }
  }

  /**
   * Get the owner address of the NFT contract
   */
  async getOwner(): Promise<string> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    return await this.contract.owner();
  }

  /**
   * Withdraw platform fees (owner only)
   */
  async withdraw(): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    const tx = await this.contract.withdraw();
    await tx.wait();
  }

  async batchMint(addresses: string[], amounts: number[]): Promise<void> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set");
    }
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    const tx = await this.contract.batchMint(addresses, amounts);
    await tx.wait();
  }
}

export function useNFTService() {
  const { thesisNFT } = useContracts();

  const mint = async (uploader: string, amount: number, overrides = {}) => {
    if (!thesisNFT) {
      throw new Error("ThesisNFT contract is not available.");
    }
    return thesisNFT.mint(uploader, amount, overrides);
  };

  // Add batchMint for admin UI
  const batchMint = async (addresses: string[], amounts: number[]) => {
    const service = NFTContractService.getInstance();
    const win = window as Window & typeof globalThis & { ethereum?: { selectedAddress?: string } };
    if (!win.ethereum || !win.ethereum.selectedAddress) {
      throw new Error("No wallet connected");
    }
    await service.setWalletAddress(win.ethereum.selectedAddress);
    return service.batchMint(addresses, amounts);
  };

  // Add more methods as needed...
  return { mint, batchMint };
}

// Mock trending NFTs and creators
export function getTrendingNFTsAndCreators() {
  return {
    nfts: [
      { id: 1, title: 'Quantum Thesis', creator: 'Alice', image: '/public/placeholder.svg' },
      { id: 2, title: 'AI Art Manifesto', creator: 'Bob', image: '/public/placeholder.svg' },
      { id: 3, title: 'Decentralized Dreams', creator: 'Carol', image: '/public/placeholder.svg' },
    ],
    creators: [
      { id: 1, name: 'Alice', avatar: '/public/placeholder.svg' },
      { id: 2, name: 'Bob', avatar: '/public/placeholder.svg' },
      { id: 3, name: 'Carol', avatar: '/public/placeholder.svg' },
    ]
  };
}

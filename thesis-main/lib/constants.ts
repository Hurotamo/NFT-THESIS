// Updated constants using client config
import { clientConfig, getContractAddress } from "@/lib/client-config"

// Contract ABI
export const THESIS_NFT_ABI = [
  "function mint(uint256 amount) external payable",
  "function totalSupply() external view returns (uint256)",
  "function maxSupply() external view returns (uint256)",
  "function price() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event Mint(address indexed to, uint256 indexed tokenId, uint256 amount)",
] as const

// Gas limits for different operations
export const GAS_LIMITS = {
  MINT: 200000,
  TRANSFER: 100000,
  APPROVE: 80000,
} as const

// Default gas price (in gwei)
export const DEFAULT_GAS_PRICE = 20

// Application constants
export const APP_CONFIG = {
  name: clientConfig.app.name,
  url: clientConfig.app.url,
  twitter: "@thesisnft",
  discord: "https://discord.gg/thesisnft",
  github: "https://github.com/thesisnft",
} as const

// Minting configuration
export const MINT_CONFIG = {
  maxPerTransaction: 10,
  maxPerWallet: 50,
  pricePerNFT: "0.08", // ETH
} as const

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  pageTransition: 800,
} as const

// Helper function to get contract address
export function getThesisNFTContract(chainId: number): string {
  return getContractAddress(chainId)
}

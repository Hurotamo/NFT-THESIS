// Client-safe configuration
// Only includes environment variables prefixed with NEXT_PUBLIC_

export const clientConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "THESIS-NFT",
    displayName: "THESIS-NFT",
    shortName: "ThesisNFT",
    description: "Support Innovation. Mint the Future.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    version: "1.0.0",
  },
  web3: {
    network: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK || "mainnet",
    enableTestnet: process.env.NEXT_PUBLIC_ENABLE_TESTNET === "true",
  },
  contracts: {
    mainnet: process.env.NEXT_PUBLIC_MAINNET_CONTRACT || "0x742d35Cc6634C0532925a3b8D4C053Ed2925a3b8",
    goerli: process.env.NEXT_PUBLIC_GOERLI_CONTRACT || "0x742d35Cc6634C0532925a3b8D4C053Ed2925a3b8",
    sepolia: process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT || "0x742d35Cc6634C0532925a3b8D4C053Ed2925a3b8",
  },
  ipfs: {
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/",
  },
  analytics: {
    trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    enabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  },
} as const

// Get contract address for current network
export function getContractAddress(chainId: number): string {
  switch (chainId) {
    case 1:
      return clientConfig.contracts.mainnet
    case 5:
      return clientConfig.contracts.goerli
    case 11155111:
      return clientConfig.contracts.sepolia
    default:
      return clientConfig.contracts.mainnet // Default fallback
  }
}

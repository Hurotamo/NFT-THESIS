// Client-side Web3 provider that uses public endpoints
import { ethers } from "ethers"

export class Web3Provider {
  private static instance: Web3Provider
  private providers: Map<number, ethers.JsonRpcProvider> = new Map()

  private constructor() {}

  static getInstance(): Web3Provider {
    if (!Web3Provider.instance) {
      Web3Provider.instance = new Web3Provider()
    }
    return Web3Provider.instance
  }

  // Use public RPC endpoints instead of API keys
  getProvider(chainId: number): ethers.JsonRpcProvider {
    if (!this.providers.has(chainId)) {
      let rpcUrl: string

      switch (chainId) {
        case 1:
          // Use public Ethereum mainnet RPC
          rpcUrl = "https://eth.llamarpc.com"
          break
        case 5:
          // Use public Goerli RPC
          rpcUrl = "https://goerli.blockpi.network/v1/rpc/public"
          break
        case 11155111:
          // Use public Sepolia RPC
          rpcUrl = "https://sepolia.blockpi.network/v1/rpc/public"
          break
        default:
          // Default to mainnet
          rpcUrl = "https://eth.llamarpc.com"
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl)
      this.providers.set(chainId, provider)
    }

    return this.providers.get(chainId)!
  }

  // Get browser provider (MetaMask)
  getBrowserProvider(): ethers.BrowserProvider | null {
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum)
    }
    return null
  }

  // Check if Web3 is available
  isWeb3Available(): boolean {
    return typeof window !== "undefined" && !!window.ethereum
  }
}

export const web3Provider = Web3Provider.getInstance()

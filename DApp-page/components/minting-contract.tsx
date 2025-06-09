"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"

// Mock contract ABI for ThesisNFT
const THESIS_NFT_ABI = [
  "function mint(uint256 amount) external payable",
  "function totalSupply() external view returns (uint256)",
  "function maxSupply() external view returns (uint256)",
  "function price() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]

// Mock contract address (replace with actual deployed contract)
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C053Ed2925a3b8"

interface MintingContractProps {
  mintAmount: number
  onMintSuccess: (txHash: string) => void
  onMintError: (error: string) => void
}

export default function MintingContract({ mintAmount, onMintSuccess, onMintError }: MintingContractProps) {
  const [isMinting, setIsMinting] = useState(false)
  const { walletAddress, isConnected } = useWallet()
  const { toast } = useToast()

  const mintNFT = async () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to mint NFTs.",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)

    try {
      const { ethers } = await import("ethers")
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, THESIS_NFT_ABI, signer)

      // Get current price (0.08 ETH per NFT)
      const pricePerNFT = ethers.parseEther("0.08")
      const totalPrice = pricePerNFT * BigInt(mintAmount)

      // Estimate gas
      const gasEstimate = await contract.mint.estimateGas(mintAmount, {
        value: totalPrice,
      })

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)

      // Execute mint transaction
      const tx = await contract.mint(mintAmount, {
        value: totalPrice,
        gasLimit: gasLimit,
      })

      toast({
        title: "Transaction Submitted! ⏳",
        description: `Minting ${mintAmount} NFT${mintAmount > 1 ? "s" : ""}. Waiting for confirmation...`,
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        onMintSuccess(receipt.hash)
        toast({
          title: "Minting Successful! 🎉",
          description: `Successfully minted ${mintAmount} ThesisNFT${mintAmount > 1 ? "s" : ""}!`,
        })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Minting error:", error)

      let errorMessage = "An unexpected error occurred."

      if (error.code === 4001) {
        errorMessage = "Transaction was rejected by user."
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient funds for transaction."
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "Smart contract execution failed. Check mint conditions."
      } else if (error.message?.includes("gas")) {
        errorMessage = "Gas estimation failed. Try adjusting gas settings."
      }

      onMintError(errorMessage)
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  return {
    mintNFT,
    isMinting,
  }
}

// Hook for contract interactions
export function useThesisContract() {
  const { walletAddress, isConnected } = useWallet()

  const getContractData = async () => {
    if (!isConnected || typeof window === "undefined" || !window.ethereum) {
      return null
    }

    try {
      const { ethers } = await import("ethers")
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, THESIS_NFT_ABI, provider)

      const [totalSupply, maxSupply, price, userBalance] = await Promise.all([
        contract.totalSupply(),
        contract.maxSupply(),
        contract.price(),
        walletAddress ? contract.balanceOf(walletAddress) : BigInt(0),
      ])

      return {
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        price: ethers.formatEther(price),
        userBalance: Number(userBalance),
      }
    } catch (error) {
      console.error("Error fetching contract data:", error)
      return null
    }
  }

  return {
    getContractData,
    contractAddress: CONTRACT_ADDRESS,
  }
}

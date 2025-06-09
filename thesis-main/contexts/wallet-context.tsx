"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

// Ethers.js imports
declare global {
  interface Window {
    ethereum?: any
  }
}

interface WalletContextType {
  isConnected: boolean
  walletAddress: string | null
  isConnecting: boolean
  chainId: number | null
  balance: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToEthereum: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const { toast } = useToast()

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
    setupEventListeners()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const { ethers } = await import("ethers")
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          const network = await provider.getNetwork()
          const balance = await provider.getBalance(address)

          setWalletAddress(address)
          setIsConnected(true)
          setChainId(Number(network.chainId))
          setBalance(ethers.formatEther(balance))
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setWalletAddress(accounts[0])
      updateBalance(accounts[0])
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
    window.location.reload() // Recommended by MetaMask
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const updateBalance = async (address: string) => {
    try {
      const { ethers } = await import("ethers")
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balance = await provider.getBalance(address)
      setBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error("Error updating balance:", error)
    }
  }

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") {
      toast({
        title: "Browser Not Supported",
        description: "Please use a Web3-enabled browser.",
        variant: "destructive",
      })
      return
    }

    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const { ethers } = await import("ethers")

      // Simple account request without additional parameters
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts returned")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      setWalletAddress(address)
      setIsConnected(true)
      setChainId(Number(network.chainId))
      setBalance(ethers.formatEther(balance))

      toast({
        title: "Wallet Connected Successfully! 🎉",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} on ${getNetworkName(Number(network.chainId))}`,
      })
    } catch (error: any) {
      console.error("Connection error:", error)

      let errorMessage = "Failed to connect wallet. Please try again."

      if (error.code === 4001 || error.message?.includes("rejected")) {
        errorMessage = "Connection request was rejected. Please try again and approve the connection."
      } else if (error.code === -32002) {
        errorMessage = "Connection request is already pending. Please check MetaMask."
      } else if (error.message?.includes("No accounts")) {
        errorMessage = "No accounts found. Please unlock your wallet."
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const disconnectWallet = useCallback(() => {
    setIsConnected(false)
    setWalletAddress(null)
    setChainId(null)
    setBalance(null)

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected safely.",
    })
  }, [toast])

  const switchToEthereum = useCallback(async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum Mainnet
      })
    } catch (error: any) {
      if (error.code === 4902) {
        toast({
          title: "Network Not Added",
          description: "Please add Ethereum network to your wallet.",
          variant: "destructive",
        })
      }
    }
  }, [toast])

  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon Mainnet"
      case 80001:
        return "Polygon Mumbai"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        isConnecting,
        chainId,
        balance,
        connectWallet,
        disconnectWallet,
        switchToEthereum,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useWallet } from "@/contexts/wallet-context"
import { useThesis } from "@/contexts/thesis-context"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Minus, Plus, LayoutDashboard, ExternalLink } from "lucide-react"
import ThesisPreviewCard from "@/components/thesis-preview-card"
import MintingProgress from "@/components/minting-progress"
import { useThesisContract } from "@/components/minting-contract"

interface MintingPageProps {
  onNavigateToLanding: () => void
  onNavigateToDashboard: () => void
}

export default function MintingPage({ onNavigateToLanding, onNavigateToDashboard }: MintingPageProps) {
  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [contractData, setContractData] = useState<any>(null)
  const { walletAddress, isConnected, chainId } = useWallet()
  const { currentThesis, addMintedThesis } = useThesis()
  const { toast } = useToast()
  const { getContractData } = useThesisContract()

  // Load contract data on mount and when wallet changes
  useEffect(() => {
    if (isConnected) {
      loadContractData()
    }
  }, [isConnected, walletAddress])

  const loadContractData = async () => {
    const data = await getContractData()
    if (data) {
      setContractData(data)
    }
  }

  const handleMint = async () => {
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

      // Mock contract interaction for demo
      // In production, replace with actual contract
      const pricePerNFT = ethers.parseEther("0.08")
      const totalPrice = pricePerNFT * BigInt(mintAmount)

      // Simulate transaction
      const tx = await signer.sendTransaction({
        to: "0x742d35Cc6634C0532925a3b8D4C053Ed2925a3b8",
        value: totalPrice,
        data: "0x", // Mock mint function call
      })

      toast({
        title: "Transaction Submitted! ⏳",
        description: `Minting ${mintAmount} NFT${mintAmount > 1 ? "s" : ""}. Waiting for confirmation...`,
      })

      // Wait for confirmation
      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        // Add to minted theses
        addMintedThesis(currentThesis, mintAmount)

        toast({
          title: "Minting Successful! 🎉",
          description: (
            <div className="flex items-center gap-2">
              <span>
                Successfully minted {mintAmount} ThesisNFT{mintAmount > 1 ? "s" : ""}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/tx/${receipt.hash}`, "_blank")}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          ),
        })

        // Refresh contract data
        await loadContractData()
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
      } else if (error.message?.includes("gas")) {
        errorMessage = "Gas estimation failed. Try adjusting gas settings."
      }

      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  const adjustMintAmount = (delta: number) => {
    setMintAmount((prev) => Math.max(1, Math.min(10, prev + delta)))
  }

  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 11155111:
        return "Sepolia Testnet"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between max-w-7xl mx-auto mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <Button onClick={onNavigateToLanding} variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={onNavigateToDashboard}
            variant="outline"
            className="bg-transparent border-white/20 hover:bg-white/10 text-white"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Portfolio
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {chainId && <div className="text-xs text-gray-400">{getNetworkName(chainId)}</div>}
          <div className="backdrop-blur-md bg-white/10 rounded-full px-4 py-2 border border-white/20">
            <span className="text-sm font-mono">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        {/* Thesis Preview */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <ThesisPreviewCard thesis={currentThesis} />
        </motion.div>

        {/* Minting Interface */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Mint Thesis NFT
              </h2>

              <div className="space-y-6">
                {/* Mint Amount */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Mint Amount (Max 10)</label>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => adjustMintAmount(-1)}
                      disabled={mintAmount <= 1}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 hover:bg-white/10 text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <Input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(Math.max(1, Math.min(10, Number.parseInt(e.target.value) || 1)))}
                      className="w-20 text-center bg-white/5 border-white/20 text-white"
                      min="1"
                      max="10"
                    />

                    <Button
                      onClick={() => adjustMintAmount(1)}
                      disabled={mintAmount >= 10}
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 hover:bg-white/10 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300">Price per NFT:</span>
                    <span className="font-semibold">{currentThesis.price} ETH</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300">Total Cost:</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {(currentThesis.price * mintAmount).toFixed(3)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Gas Fee (est.):</span>
                    <span className="text-gray-400">~0.005 ETH</span>
                  </div>
                </div>

                {/* Contract Info */}
                {contractData && (
                  <div className="backdrop-blur-sm bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="font-semibold text-blue-300 mb-2">Live Contract Data</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Your NFTs:</span>
                        <span className="ml-2 text-white">{contractData.userBalance}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Supply:</span>
                        <span className="ml-2 text-white">{contractData.totalSupply}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minting Progress */}
                <MintingProgress
                  minted={contractData?.totalSupply || currentThesis.minted}
                  total={contractData?.maxSupply || currentThesis.totalSupply}
                />

                {/* Mint Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleMint}
                    disabled={isMinting || !isConnected}
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Minting in Progress...
                      </>
                    ) : !isConnected ? (
                      "Connect Wallet to Mint"
                    ) : (
                      `Mint ${mintAmount} NFT${mintAmount > 1 ? "s" : ""} Now`
                    )}
                  </Button>
                </motion.div>

                {/* Investment Impact */}
                <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Your Investment Impact</h4>
                  <p className="text-sm text-gray-300">
                    By minting this thesis NFT, you're directly supporting {currentThesis.author}'s research at{" "}
                    {currentThesis.university} and contributing to the advancement of {currentThesis.category}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

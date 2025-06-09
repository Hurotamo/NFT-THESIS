"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { Wallet, LogOut, Loader2, AlertTriangle } from "lucide-react"

export default function WalletConnect() {
  const {
    isConnected,
    walletAddress,
    isConnecting,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchToEthereum,
  } = useWallet()

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Wallet connection failed:", error)
    }
  }

  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 5:
        return "Goerli"
      case 11155111:
        return "Sepolia"
      case 137:
        return "Polygon"
      case 80001:
        return "Mumbai"
      default:
        return `Chain ${chainId}`
    }
  }

  const isWrongNetwork = chainId && chainId !== 1 && chainId !== 5 && chainId !== 11155111

  if (isConnected && walletAddress) {
    return (
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="backdrop-blur-md bg-white/10 rounded-lg px-4 py-2 border border-white/20">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {balance && <span>{Number.parseFloat(balance).toFixed(4)} ETH</span>}
                {chainId && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${isWrongNetwork ? "border-red-500 text-red-400" : "border-green-500 text-green-400"}`}
                  >
                    {getNetworkName(chainId)}
                  </Badge>
                )}
              </div>
            </div>
            {isWrongNetwork && (
              <Button
                onClick={switchToEthereum}
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400 text-xs"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Switch
              </Button>
            )}
          </div>
        </div>
        <Button
          onClick={disconnectWallet}
          variant="outline"
          size="sm"
          className="bg-transparent border-white/20 hover:bg-white/10 text-white"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </motion.div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  )
}

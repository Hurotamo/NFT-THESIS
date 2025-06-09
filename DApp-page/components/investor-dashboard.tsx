"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useThesis } from "@/contexts/thesis-context"
import { useWallet } from "@/contexts/wallet-context"
import { ArrowLeft, Plus, TrendingUp, Calendar, GraduationCap } from "lucide-react"

interface InvestorDashboardProps {
  onNavigateToLanding: () => void
  onNavigateToMinting: () => void
}

export default function InvestorDashboard({ onNavigateToLanding, onNavigateToMinting }: InvestorDashboardProps) {
  const { mintedTheses } = useThesis()
  const { walletAddress } = useWallet()

  const totalInvested = mintedTheses.reduce((sum, thesis) => sum + thesis.price, 0)
  const uniqueTheses = new Set(mintedTheses.map((thesis) => thesis.title)).size

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Investment Portfolio
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="backdrop-blur-md bg-white/10 rounded-full px-4 py-2 border border-white/20">
            <span className="text-sm font-mono">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>
          <Button
            onClick={onNavigateToMinting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mint More
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Invested</p>
                <p className="text-2xl font-bold text-blue-400">{totalInvested.toFixed(3)} ETH</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">NFTs Owned</p>
                <p className="text-2xl font-bold text-purple-400">{mintedTheses.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unique Projects</p>
                <p className="text-2xl font-bold text-green-400">{uniqueTheses}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio Content */}
      <div className="max-w-7xl mx-auto">
        {mintedTheses.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="backdrop-blur-md bg-white/5 rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-300">No NFTs Yet</h3>
              <p className="text-gray-400 mb-6">Start your investment journey by minting your first thesis NFT.</p>
              <Button
                onClick={onNavigateToMinting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Mint Your First NFT
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-300">Your Thesis NFT Collection</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mintedTheses.map((thesis, index) => (
                <motion.div
                  key={`${thesis.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:border-blue-500/30 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge className="bg-blue-500/80 text-white border-0 mb-2">{thesis.category}</Badge>
                        <span className="text-xs text-gray-400">
                          {thesis.mintedDate && new Date(thesis.mintedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-tight text-white">{thesis.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <GraduationCap className="w-4 h-4" />
                          <span>{thesis.author}</span>
                        </div>
                        <div className="text-sm text-gray-400">{thesis.university}</div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                          <span className="text-sm text-gray-400">Minted for:</span>
                          <span className="font-semibold text-blue-400">{thesis.price} ETH</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

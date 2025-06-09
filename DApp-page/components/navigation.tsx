"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import WalletConnect from "@/components/wallet-connect"
import { useWallet } from "@/contexts/wallet-context"
import { LayoutDashboard } from "lucide-react"
import { clientConfig } from "@/lib/client-config"

interface NavigationProps {
  onNavigateToDashboard: () => void
}

export default function Navigation({ onNavigateToDashboard }: NavigationProps) {
  const { isConnected } = useWallet()

  return (
    <nav className="relative z-10 p-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {clientConfig.app.displayName}
              </h1>
              <p className="text-xs text-gray-400">Investor Platform</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isConnected && (
            <Button
              onClick={onNavigateToDashboard}
              variant="outline"
              size="sm"
              className="bg-transparent border-white/20 hover:bg-white/10 text-white"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Portfolio
            </Button>
          )}
          <WalletConnect />
        </motion.div>
      </div>
    </nav>
  )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LandingPage from "@/components/landing-page"
import MintingPage from "@/components/minting-page"
import InvestorDashboard from "@/components/investor-dashboard"
import { WalletProvider } from "@/contexts/wallet-context"
import { ThesisProvider } from "@/contexts/thesis-context"
import { Toaster } from "@/components/ui/toaster"

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "minting" | "dashboard">("landing")

  return (
    <WalletProvider>
      <ThesisProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
          <AnimatePresence mode="wait">
            {currentPage === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <LandingPage
                  onNavigateToMinting={() => setCurrentPage("minting")}
                  onNavigateToDashboard={() => setCurrentPage("dashboard")}
                />
              </motion.div>
            )}
            {currentPage === "minting" && (
              <motion.div
                key="minting"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <MintingPage
                  onNavigateToLanding={() => setCurrentPage("landing")}
                  onNavigateToDashboard={() => setCurrentPage("dashboard")}
                />
              </motion.div>
            )}
            {currentPage === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.5 }}
              >
                <InvestorDashboard
                  onNavigateToLanding={() => setCurrentPage("landing")}
                  onNavigateToMinting={() => setCurrentPage("minting")}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Toaster />
        </div>
      </ThesisProvider>
    </WalletProvider>
  )
}

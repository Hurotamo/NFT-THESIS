"use client"

import { motion } from "framer-motion"
import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import FloatingBooks from "@/components/floating-books"
import Navigation from "@/components/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { GraduationCap, TrendingUp, Shield, Users } from "lucide-react"

interface LandingPageProps {
  onNavigateToMinting: () => void
  onNavigateToDashboard: () => void
}

export default function LandingPage({ onNavigateToMinting, onNavigateToDashboard }: LandingPageProps) {
  const { isConnected } = useWallet()

  return (
    <div className="relative min-h-screen">
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
            <FloatingBooks />
          </Suspense>
        </Canvas>
      </div>

      {/* Navigation */}
      <Navigation onNavigateToDashboard={onNavigateToDashboard} />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <motion.section
        className="relative z-10 py-20 px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            Why Invest in Academic Innovation?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: GraduationCap,
                title: "Support Education",
                description: "Directly fund groundbreaking research and student innovation",
              },
              {
                icon: TrendingUp,
                title: "Investment Potential",
                description: "Early access to revolutionary ideas with growth potential",
              },
              {
                icon: Shield,
                title: "Blockchain Verified",
                description: "Secure ownership and authenticity guaranteed on-chain",
              },
              {
                icon: Users,
                title: "Community Impact",
                description: "Join a network of forward-thinking education supporters",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.div
        className="relative z-10 text-center pb-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        {isConnected && (
          <div className="space-y-4">
            <motion.button
              onClick={onNavigateToMinting}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 mr-4"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              Mint Thesis NFT →
            </motion.button>
            <motion.button
              onClick={onNavigateToDashboard}
              className="px-8 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full font-semibold text-lg hover:bg-purple-600/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Portfolio
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

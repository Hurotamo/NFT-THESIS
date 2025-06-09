"use client"

import { motion } from "framer-motion"

export default function HeroSection() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div
        className="text-center max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-6 py-2 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-blue-300">Supporting Academic Innovation</span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Support Innovation.
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Mint the Future.
          </span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          Invest in groundbreaking student research by minting thesis projects as NFTs.
          <br />
          <span className="text-blue-400">Fund the next generation of innovators.</span>
        </motion.p>

        <motion.div
          className="backdrop-blur-md bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <h3 className="text-2xl font-semibold mb-6 text-blue-300">Platform Highlights</h3>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">🎓</span>
              </div>
              <h4 className="font-semibold text-lg">Academic Excellence</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Curated thesis projects from top universities worldwide
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">💎</span>
              </div>
              <h4 className="font-semibold text-lg">Exclusive Access</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Limited edition NFTs representing breakthrough research
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">🚀</span>
              </div>
              <h4 className="font-semibold text-lg">Future Impact</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Support research that shapes tomorrow's technology
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

"use client"

import { motion } from "framer-motion"

interface MintingProgressProps {
  minted: number
  total: number
}

export default function MintingProgress({ minted, total }: MintingProgressProps) {
  const percentage = (minted / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">Minting Progress</span>
        <span className="text-gray-300">
          {minted.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{percentage.toFixed(1)}% minted</span>
        <span>{(total - minted).toLocaleString()} remaining</span>
      </div>
    </div>
  )
}

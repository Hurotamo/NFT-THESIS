"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Building2 } from "lucide-react"

interface ThesisProject {
  id: string
  title: string
  author: string
  university: string
  category: string
  description: string
  abstract: string
  price: number
  totalSupply: number
  minted: number
  image: string
}

interface ThesisPreviewCardProps {
  thesis: ThesisProject
}

export default function ThesisPreviewCard({ thesis }: ThesisPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -15 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 1 }}
      whileHover={{
        scale: 1.02,
        rotateY: 2,
        transition: { duration: 0.3 },
      }}
    >
      <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Thesis Image/Visual */}
          <div className="h-64 bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-6xl opacity-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                🎓
              </motion.div>
            </div>
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-500/80 text-white border-0">{thesis.category}</Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <Badge className="bg-purple-500/80 text-white border-0">#{thesis.id.split("-")[1]}</Badge>
            </div>
          </div>

          {/* Thesis Details */}
          <div className="p-6">
            <motion.h3
              className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {thesis.title}
            </motion.h3>

            <motion.div
              className="flex items-center gap-4 mb-4 text-sm text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                <span>{thesis.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{thesis.university}</span>
              </div>
            </motion.div>

            <motion.p
              className="text-gray-300 mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {thesis.description}
            </motion.p>

            {/* Abstract Section */}
            <motion.div
              className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h4 className="font-semibold text-blue-300 mb-2">Abstract</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{thesis.abstract}</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Price</div>
                <div className="text-blue-400 font-semibold">{thesis.price} ETH</div>
              </div>
              <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Supply</div>
                <div className="text-purple-400 font-semibold">{thesis.totalSupply.toLocaleString()}</div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

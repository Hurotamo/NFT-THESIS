"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import { OrbitControls } from "@react-three/drei"

function NFT3DModel() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <dodecahedronGeometry args={[1]} />
      <meshStandardMaterial color="#8b5cf6" metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

export default function NFTPreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -15 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 1 }}
      whileHover={{
        scale: 1.02,
        rotateY: 5,
        transition: { duration: 0.3 },
      }}
    >
      <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* 3D NFT Preview */}
          <div className="h-80 bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative">
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />
                <NFT3DModel />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
              </Suspense>
            </Canvas>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>

          {/* NFT Info */}
          <div className="p-6">
            <motion.h3
              className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              ThesisNFT #????
            </motion.h3>

            <motion.p
              className="text-gray-300 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              A unique digital collectible with rare traits and blockchain verification.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Rarity</div>
                <div className="text-purple-400 font-semibold">Legendary</div>
              </div>
              <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Edition</div>
                <div className="text-pink-400 font-semibold">1 of 10,000</div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

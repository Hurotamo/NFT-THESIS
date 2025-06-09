"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"

export default function FloatingBooks() {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Floating Book 1 */}
      <mesh position={[3, 1, 0]} rotation={[0.2, 0.3, 0.1]}>
        <boxGeometry args={[0.8, 1.2, 0.1]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>

      {/* Floating Book 2 */}
      <mesh position={[-2, 0.5, 1]} rotation={[0.1, -0.2, 0.05]}>
        <boxGeometry args={[0.7, 1, 0.08]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.25} />
      </mesh>

      {/* Floating Scroll */}
      <mesh position={[0, -1, -1]} rotation={[0.3, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.2} />
      </mesh>

      {/* Academic Cap */}
      <mesh position={[-3, -0.5, 0]} rotation={[0.1, 0.8, 0]}>
        <coneGeometry args={[0.6, 0.3, 4]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.2} />
      </mesh>

      {/* Floating Diploma */}
      <mesh position={[1, -2, 2]} rotation={[0.4, -0.3, 0.2]}>
        <planeGeometry args={[1, 0.7]} />
        <meshStandardMaterial color="#ec4899" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

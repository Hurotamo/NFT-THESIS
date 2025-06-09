"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"

export default function FloatingCube() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <>
      <mesh ref={meshRef} position={[2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.3} wireframe />
      </mesh>

      <mesh position={[-2, 1, -1]} rotation={[0.5, 0.5, 0]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#ec4899" transparent opacity={0.2} wireframe />
      </mesh>

      <mesh position={[0, -2, 1]} rotation={[1, 0, 0.5]}>
        <tetrahedronGeometry args={[0.6]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.25} wireframe />
      </mesh>
    </>
  )
}

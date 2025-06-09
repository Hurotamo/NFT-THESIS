"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

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
  mintedDate?: string
}

interface ThesisContextType {
  currentThesis: ThesisProject
  mintedTheses: ThesisProject[]
  addMintedThesis: (thesis: ThesisProject, amount: number) => void
}

const mockThesis: ThesisProject = {
  id: "thesis-001",
  title: "Quantum Computing Applications in Cryptographic Security",
  author: "Sarah Chen",
  university: "MIT",
  category: "Computer Science",
  description:
    "Exploring the revolutionary potential of quantum computing in enhancing cryptographic protocols and blockchain security mechanisms.",
  abstract:
    "This thesis investigates the intersection of quantum computing and cryptographic security, proposing novel approaches to quantum-resistant encryption methods. Through comprehensive analysis and experimental validation, we demonstrate how quantum algorithms can both threaten and strengthen current security paradigms.",
  price: 0.08,
  totalSupply: 1000,
  minted: 247,
  image: "/placeholder.svg?height=400&width=400",
}

const ThesisContext = createContext<ThesisContextType | undefined>(undefined)

export function ThesisProvider({ children }: { children: React.ReactNode }) {
  const [currentThesis] = useState<ThesisProject>(mockThesis)
  const [mintedTheses, setMintedTheses] = useState<ThesisProject[]>([])

  const addMintedThesis = (thesis: ThesisProject, amount: number) => {
    const mintedThesis = {
      ...thesis,
      mintedDate: new Date().toISOString(),
    }

    // Add multiple entries for the amount minted
    const newMints = Array(amount)
      .fill(mintedThesis)
      .map((thesis, index) => ({
        ...thesis,
        id: `${thesis.id}-mint-${Date.now()}-${index}`,
      }))

    setMintedTheses((prev) => [...prev, ...newMints])
  }

  return (
    <ThesisContext.Provider
      value={{
        currentThesis,
        mintedTheses,
        addMintedThesis,
      }}
    >
      {children}
    </ThesisContext.Provider>
  )
}

export function useThesis() {
  const context = useContext(ThesisContext)
  if (context === undefined) {
    throw new Error("useThesis must be used within a ThesisProvider")
  }
  return context
}

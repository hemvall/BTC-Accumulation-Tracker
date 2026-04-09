"use client"

import { useEffect, useState } from "react"
import { Strategy } from "@/lib/types"
import { getStrategy, saveStrategy } from "@/lib/store"
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price"
import { StrategySetup } from "@/components/strategy-setup"
import { Dashboard } from "@/components/dashboard"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { price } = useBitcoinPrice()

  useEffect(() => {
    const stored = getStrategy()
    setStrategy(stored)
    setIsLoading(false)
  }, [])

  const handleStrategyComplete = (newStrategy: Strategy) => {
    saveStrategy(newStrategy)
    setStrategy(newStrategy)
  }

  const handleReset = () => {
    setStrategy(null)
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (!strategy) {
    return (
      <>
        <Navbar />
        <StrategySetup 
          onComplete={handleStrategyComplete} 
          currentPrice={price}
        />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Dashboard 
        strategy={strategy}
        currentPrice={price}
        onStrategyUpdate={setStrategy}
        onReset={handleReset}
      />
    </>
  )
}

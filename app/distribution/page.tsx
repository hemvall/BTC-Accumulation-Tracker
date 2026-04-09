"use client"

import { useEffect, useState } from "react"
import { Strategy, Wallet } from "@/lib/types"
import { getStrategy, getWallets } from "@/lib/store"
import { useBitcoinPrice } from "@/hooks/use-bitcoin-price"
import { WalletDistribution } from "@/components/wallet-distribution"
import { Navbar } from "@/components/navbar"
import { BitcoinPriceDisplay } from "@/components/bitcoin-price-display"
import { Card, CardContent } from "@/components/ui/card"
import { Bitcoin, Wallet as WalletIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function DistributionPage() {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { price, loading: priceLoading } = useBitcoinPrice()

  useEffect(() => {
    const storedStrategy = getStrategy()
    const storedWallets = getWallets()
    setStrategy(storedStrategy)
    setWallets(storedWallets)
    setIsLoading(false)
  }, [])

  const totalBtcAccumulated = strategy?.totalBtc ?? 0
  const totalBtcInWallets = wallets.reduce((acc, w) => acc + w.btcAmount, 0)
  const unallocatedBtc = Math.max(0, totalBtcAccumulated - totalBtcInWallets)
  const allocationPercent = totalBtcAccumulated > 0 ? (totalBtcInWallets / totalBtcAccumulated) * 100 : 0

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

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">BTC Distribution</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track where your Bitcoin is stored
            </p>
          </div>
          <BitcoinPriceDisplay price={price} loading={priceLoading} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Bitcoin className="h-4 w-4" />
                <span>Total Accumulated</span>
              </div>
              <p className="text-xl font-bold tabular-nums font-mono">
                {totalBtcAccumulated.toFixed(8)}
              </p>
              {price && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${(totalBtcAccumulated * price).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <WalletIcon className="h-4 w-4" />
                <span>In Wallets</span>
              </div>
              <p className="text-xl font-bold tabular-nums font-mono">
                {totalBtcInWallets.toFixed(8)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {allocationPercent.toFixed(1)}% allocated
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-border/50",
            unallocatedBtc > 0 ? "bg-primary/5" : "bg-green-500/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>Unallocated</span>
              </div>
              <p className={cn(
                "text-xl font-bold tabular-nums font-mono",
                unallocatedBtc > 0 ? "text-primary" : "text-green-500"
              )}>
                {unallocatedBtc > 0 ? unallocatedBtc.toFixed(8) : "0.00000000"}
              </p>
              {unallocatedBtc === 0 && totalBtcAccumulated > 0 && (
                <p className="text-xs text-green-500 mt-1">All BTC allocated</p>
              )}
              {unallocatedBtc > 0 && price && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${(unallocatedBtc * price).toLocaleString("en-US", { maximumFractionDigits: 0 })} to assign
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Allocation Progress */}
        {totalBtcAccumulated > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Allocation Progress</span>
              <span className="font-medium">{allocationPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  allocationPercent >= 100 ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(allocationPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* No BTC Warning */}
        {totalBtcAccumulated === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">No BTC accumulated yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start by buying some Bitcoin through your DCA strategy on the{" "}
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Distribution */}
        <WalletDistribution 
          wallets={wallets} 
          onWalletsChange={setWallets}
          currentPrice={price}
          totalBtcAccumulated={totalBtcAccumulated}
          unallocatedBtc={unallocatedBtc}
        />
      </main>
    </>
  )
}

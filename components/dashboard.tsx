"use client"

import { useState } from "react"
import { Strategy } from "@/lib/types"
import { saveStrategy, executePurchase, savePurchase, markSupportBroken, removeSupport, clearAllData, addSupport } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Support } from "@/lib/types"
import { BitcoinPriceDisplay } from "./bitcoin-price-display"
import { 
  Bitcoin, 
  DollarSign, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus,
  Trash2,
  RotateCcw,
  ShoppingCart,
  PlayCircle,
  Calculator
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardProps {
  strategy: Strategy
  currentPrice: number | null
  onStrategyUpdate: (strategy: Strategy) => void
  onReset: () => void
}

const DEFAULT_PROJECTION_PRICES = [60000, 90000, 100000, 150000, 250000]

export function Dashboard({ strategy, currentPrice, onStrategyUpdate, onReset }: DashboardProps) {
  const [showAddSupport, setShowAddSupport] = useState(false)
  const [newSupportPrice, setNewSupportPrice] = useState("")
  const [newSupportAllocation, setNewSupportAllocation] = useState("")
  const [simulationMode, setSimulationMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supportToDelete, setSupportToDelete] = useState<Support | null>(null)
  const [customTargets, setCustomTargets] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("btc-custom-targets")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [newTargetPrice, setNewTargetPrice] = useState("")
  const [showAddTarget, setShowAddTarget] = useState(false)
  const allProjectionPrices = [...DEFAULT_PROJECTION_PRICES, ...customTargets].sort((a, b) => a - b)

  // Calculate simulation data (as if all pending orders were filled)
  const pendingSupports = strategy.supports.filter(s => s.status === "pending")
  const simulatedBtc = pendingSupports.reduce((acc, s) => acc + (s.allocation / s.price), 0)
  const simulatedInvested = pendingSupports.reduce((acc, s) => acc + s.allocation, 0)
  
  const totalBtcWithSim = strategy.totalBtc + (simulationMode ? simulatedBtc : 0)
  const totalInvestedWithSim = (strategy.totalCapital - strategy.remainingCapital) + (simulationMode ? simulatedInvested : 0)
  const avgPriceWithSim = totalInvestedWithSim > 0 ? totalInvestedWithSim / totalBtcWithSim : 0

  const currentValue = currentPrice ? totalBtcWithSim * currentPrice : 0
  const totalInvested = strategy.totalCapital - strategy.remainingCapital
  const pnl = currentValue - totalInvestedWithSim
  const pnlPercent = totalInvestedWithSim > 0 ? (pnl / totalInvestedWithSim) * 100 : 0

  const handleBuy = (supportId: string) => {
    const { strategy: newStrategy, purchase } = executePurchase(strategy, supportId)
    saveStrategy(newStrategy)
    savePurchase(purchase)
    onStrategyUpdate(newStrategy)
  }

  const handleMarkBroken = (supportId: string) => {
    const newStrategy = markSupportBroken(strategy, supportId)
    saveStrategy(newStrategy)
    onStrategyUpdate(newStrategy)
  }

  const handleRemoveSupport = (supportId: string) => {
    const newStrategy = removeSupport(strategy, supportId)
    saveStrategy(newStrategy)
    onStrategyUpdate(newStrategy)
  }

  const handleOpenDeleteDialog = (support: Support) => {
    setSupportToDelete(support)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (supportToDelete) {
      const newStrategy = removeSupport(strategy, supportToDelete.id)
      saveStrategy(newStrategy)
      onStrategyUpdate(newStrategy)
      setSupportToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleAddTarget = () => {
    const price = parseFloat(newTargetPrice)
    if (price > 0 && !allProjectionPrices.includes(price)) {
      const newTargets = [...customTargets, price]
      setCustomTargets(newTargets)
      localStorage.setItem("btc-custom-targets", JSON.stringify(newTargets))
      setNewTargetPrice("")
      setShowAddTarget(false)
    }
  }

  const handleRemoveTarget = (price: number) => {
    const newTargets = customTargets.filter(t => t !== price)
    setCustomTargets(newTargets)
    localStorage.setItem("btc-custom-targets", JSON.stringify(newTargets))
  }

  const handleAddSupport = () => {
    if (!newSupportPrice || !newSupportAllocation) return
    const newStrategy = addSupport(strategy, parseFloat(newSupportPrice), parseFloat(newSupportAllocation))
    saveStrategy(newStrategy)
    onStrategyUpdate(newStrategy)
    setNewSupportPrice("")
    setNewSupportAllocation("")
    setShowAddSupport(false)
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      clearAllData()
      onReset()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "touched":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "broken":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-primary" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "touched":
        return "Bought"
      case "broken":
        return "Broken"
      default:
        return "Waiting"
    }
  }

  const getDistanceToSupport = (supportPrice: number) => {
    if (!currentPrice) return null
    const distance = ((currentPrice - supportPrice) / currentPrice) * 100
    return distance
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bitcoin className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">BTC DCA Tracker</span>
          </div>
          <BitcoinPriceDisplay />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Simulation Toggle */}
        {pendingSupports.length > 0 && (
          <Card className={cn(
            "border transition-all",
            simulationMode ? "bg-primary/10 border-primary/40" : "bg-card/50 border-border/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlayCircle className={cn("h-5 w-5", simulationMode ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-sm">Simulation Mode</p>
                    <p className="text-xs text-muted-foreground">
                      See projections as if all {pendingSupports.length} pending orders were filled
                    </p>
                  </div>
                </div>
                <Button
                  variant={simulationMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSimulationMode(!simulationMode)}
                >
                  {simulationMode ? "Active" : "Activate"}
                </Button>
              </div>
              {simulationMode && (
                <div className="mt-3 pt-3 border-t border-primary/20 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Simulated BTC</p>
                    <p className="font-mono text-primary">+{simulatedBtc.toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Simulated Invest</p>
                    <p className="font-mono text-primary">+${simulatedInvested.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">New Avg Price</p>
                    <p className="font-mono text-primary">${avgPriceWithSim.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={cn("border-border/50", simulationMode ? "bg-primary/5" : "bg-card/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Bitcoin className="h-4 w-4" />
                <span>BTC {simulationMode ? "(Sim)" : "Accumulated"}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {totalBtcWithSim.toFixed(8)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {simulationMode 
                  ? `Real: ${strategy.totalBtc.toFixed(8)}`
                  : `$${totalInvested.toLocaleString()} invested`
                }
              </p>
            </CardContent>
          </Card>

          <Card className={cn("border-border/50", simulationMode ? "bg-primary/5" : "bg-card/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                <span>Current Value</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">
                ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>

          <Card className={cn("border-border/50", simulationMode ? "bg-primary/5" : "bg-card/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>P&L</span>
              </div>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                pnl >= 0 ? "text-green-500" : "text-red-400"
              )}>
                {pnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
              </p>
              {totalInvestedWithSim > 0 && (
                <p className={cn(
                  "text-xs tabular-nums mt-1",
                  pnl >= 0 ? "text-green-500/70" : "text-red-400/70"
                )}>
                  {pnl >= 0 ? "+" : ""}${pnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={cn("border-border/50", simulationMode ? "bg-primary/5" : "bg-card/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Target className="h-4 w-4" />
                <span>Avg Price</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">
                ${(simulationMode ? avgPriceWithSim : strategy.averagePrice) > 0 
                  ? (simulationMode ? avgPriceWithSim : strategy.averagePrice).toLocaleString("en-US", { maximumFractionDigits: 0 }) 
                  : "---"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Capital Overview */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Capital Deployment</span>
              <span className="text-sm">
                <span className="text-primary font-medium">${totalInvested.toLocaleString()}</span>
                <span className="text-muted-foreground"> / ${strategy.totalCapital.toLocaleString()}</span>
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(totalInvested / strategy.totalCapital) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${strategy.remainingCapital.toLocaleString()} remaining for future supports
            </p>
          </CardContent>
        </Card>

        {/* Support Zones */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Support Zones</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddSupport(!showAddSupport)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddSupport && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-dashed border-primary/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Price Level</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="58,000"
                        value={newSupportPrice}
                        onChange={(e) => setNewSupportPrice(e.target.value)}
                        className="pl-7 h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Allocation</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="1,000"
                        value={newSupportAllocation}
                        onChange={(e) => setNewSupportAllocation(e.target.value)}
                        className="pl-7 h-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSupport} disabled={!newSupportPrice || !newSupportAllocation}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddSupport(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {strategy.supports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No support zones defined yet</p>
                <p className="text-sm">Add your first support zone above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategy.supports.map((support) => {
                  const distance = getDistanceToSupport(support.price)
                  const isNearby = distance !== null && distance < 10 && distance > 0
                  const isClickable = support.status === "touched" || support.status === "broken"
                  
                  return (
                    <div
                      key={support.id}
                      onClick={() => isClickable && handleOpenDeleteDialog(support)}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        support.status === "touched" && "bg-green-500/5 border-green-500/20 cursor-pointer hover:bg-green-500/10",
                        support.status === "broken" && "bg-red-400/5 border-red-400/20 opacity-60 cursor-pointer hover:bg-red-400/10",
                        support.status === "pending" && isNearby && "bg-primary/5 border-primary/30",
                        support.status === "pending" && !isNearby && "bg-secondary/30 border-border/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(support.status)}
                          <div>
                            <p className="font-semibold tabular-nums">
                              ${support.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {support.status === "touched" ? (
                                <>
                                  Bought ${support.amountSpent?.toLocaleString() || support.allocation.toLocaleString()} @ ${support.price.toLocaleString()} = {support.btcBought?.toFixed(8)} BTC
                                </>
                              ) : (
                                <>${support.allocation.toLocaleString()} allocated</>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {support.status === "pending" && distance !== null && (
                            <span className={cn(
                              "text-xs px-2 py-1 rounded",
                              isNearby ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            )}>
                              {distance > 0 ? `-${distance.toFixed(1)}%` : `+${Math.abs(distance).toFixed(1)}%`}
                            </span>
                          )}
                          
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            support.status === "touched" && "bg-green-500/10 text-green-500",
                            support.status === "broken" && "bg-red-400/10 text-red-400",
                            support.status === "pending" && "bg-primary/10 text-primary"
                          )}>
                            {getStatusLabel(support.status)}
                          </span>

                          {support.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                onClick={() => handleBuy(support.id)}
                                title="Execute buy"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                onClick={() => handleMarkBroken(support.id)}
                                title="Mark as broken"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleRemoveSupport(support.id)}
                                title="Remove support"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Projections */}
        {(totalBtcWithSim > 0 || simulationMode) && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Portfolio Projections {simulationMode && <span className="text-xs text-primary font-normal">(Simulation)</span>}
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTarget(!showAddTarget)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Target
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddTarget && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-dashed border-primary/30 flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Custom Price Target</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="200000"
                        value={newTargetPrice}
                        onChange={(e) => setNewTargetPrice(e.target.value)}
                        className="pl-7 h-9"
                        onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
                      />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddTarget} disabled={!newTargetPrice}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddTarget(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {allProjectionPrices.map((price) => {
                  const projectedValue = totalBtcWithSim * price
                  const projectedPnl = projectedValue - totalInvestedWithSim
                  const projectedPnlPercent = totalInvestedWithSim > 0 ? (projectedPnl / totalInvestedWithSim) * 100 : 0
                  const isCurrentRange = currentPrice && Math.abs(currentPrice - price) < 5000
                  const isCustom = customTargets.includes(price)
                  
                  return (
                    <div 
                      key={price}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all relative group",
                        isCurrentRange ? "bg-primary/10 border-primary/40" : "bg-secondary/30 border-border/50",
                        isCustom && "ring-1 ring-primary/30"
                      )}
                    >
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveTarget(price)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove target"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      )}
                      <p className={cn(
                        "text-sm font-medium mb-2",
                        isCurrentRange ? "text-primary" : "text-muted-foreground"
                      )}>
                        @ ${(price / 1000).toFixed(0)}k
                        {isCustom && <span className="ml-1 text-[10px] text-primary">(custom)</span>}
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        ${projectedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </p>
                      <p className={cn(
                        "text-xs font-medium tabular-nums mt-1",
                        projectedPnl >= 0 ? "text-green-500" : "text-red-400"
                      )}>
                        {projectedPnl >= 0 ? "+" : ""}{projectedPnlPercent.toFixed(0)}%
                        <span className="text-muted-foreground ml-1">
                          ({projectedPnl >= 0 ? "+" : ""}${(projectedPnl / 1000).toFixed(1)}k)
                        </span>
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Based on {totalBtcWithSim.toFixed(8)} BTC with ${totalInvestedWithSim.toLocaleString()} invested
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-primary font-medium">Discipline tip:</span> Buying on weakness during fear is how you build a strong position. 
              The goal is to accumulate more BTC at lower prices, not to time the perfect bottom.
            </p>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Data
          </Button>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {supportToDelete?.status === "touched" ? "position" : "support"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {supportToDelete && (
                  <>
                    <p>
                      You are about to delete the {supportToDelete.status === "touched" ? "position" : "broken support"} at{" "}
                      <span className="font-semibold text-foreground">${supportToDelete.price.toLocaleString()}</span>.
                    </p>
                    {supportToDelete.status === "touched" && supportToDelete.btcBought && (
                      <p className="mt-2">
                        This will remove <span className="font-mono text-foreground">{supportToDelete.btcBought.toFixed(8)} BTC</span>{" "}
                        (${supportToDelete.amountSpent?.toLocaleString()}) from your portfolio tracking.
                      </p>
                    )}
                    <p className="mt-2 text-destructive">This action cannot be undone.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {supportToDelete?.status === "touched" ? "Position" : "Support"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

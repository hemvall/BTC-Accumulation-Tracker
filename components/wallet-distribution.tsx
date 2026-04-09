"use client"

import { useState } from "react"
import { Wallet } from "@/lib/types"
import { addWallet, updateWallet, removeWallet, saveWallets } from "@/lib/store"
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
import { 
  Wallet as WalletIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Copy,
  CheckCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletDistributionProps {
  wallets: Wallet[]
  onWalletsChange: (wallets: Wallet[]) => void
  currentPrice: number | null
  totalBtcAccumulated?: number
  unallocatedBtc?: number
}

export function WalletDistribution({ 
  wallets, 
  onWalletsChange, 
  currentPrice,
  totalBtcAccumulated = 0,
  unallocatedBtc = 0
}: WalletDistributionProps) {
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const totalBtc = wallets.reduce((acc, w) => acc + w.btcAmount, 0)
  const totalValue = currentPrice ? totalBtc * currentPrice : 0

  const handleAddWallet = () => {
    const amount = parseFloat(newAmount)
    if (newLabel && amount >= 0 && amount <= unallocatedBtc) {
      const wallet = addWallet(newLabel, newAddress, amount)
      onWalletsChange([...wallets, wallet])
      setNewLabel("")
      setNewAddress("")
      setNewAmount("")
      setShowAddWallet(false)
    }
  }

  const newAmountValue = parseFloat(newAmount) || 0
  const isAmountOverLimit = newAmountValue > unallocatedBtc
  const canAddWallet = newLabel && newAmount && !isAmountOverLimit && newAmountValue >= 0

  const handleStartEdit = (wallet: Wallet) => {
    setEditingId(wallet.id)
    setEditLabel(wallet.label)
    setEditAmount(wallet.btcAmount.toString())
  }

  const handleSaveEdit = (walletId: string, currentAmount: number) => {
    const amount = parseFloat(editAmount)
    const maxAllowed = unallocatedBtc + currentAmount
    if (editLabel && amount >= 0 && amount <= maxAllowed) {
      updateWallet(walletId, { label: editLabel, btcAmount: amount })
      onWalletsChange(wallets.map(w => 
        w.id === walletId ? { ...w, label: editLabel, btcAmount: amount } : w
      ))
      setEditingId(null)
    }
  }

  const getEditAmountOverLimit = (currentAmount: number) => {
    const amount = parseFloat(editAmount) || 0
    return amount > unallocatedBtc + currentAmount
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditLabel("")
    setEditAmount("")
  }

  const handleOpenDeleteDialog = (wallet: Wallet) => {
    setWalletToDelete(wallet)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (walletToDelete) {
      removeWallet(walletToDelete.id)
      onWalletsChange(wallets.filter(w => w.id !== walletToDelete.id))
      setWalletToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleCopyAddress = (wallet: Wallet) => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopiedId(wallet.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const shortenAddress = (address: string) => {
    if (!address || address.length < 16) return address
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">BTC Distribution</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddWallet(!showAddWallet)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Wallet Form */}
          {showAddWallet && (
            <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-dashed border-primary/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Label *</Label>
                  <Input
                    placeholder="Ledger, Coinbase, Cold Storage..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">BTC Amount *</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className={cn("h-9 font-mono", isAmountOverLimit && "border-destructive focus-visible:ring-destructive")}
                  />
                  {isAmountOverLimit && (
                    <p className="text-xs text-destructive">
                      Cannot exceed available BTC ({unallocatedBtc.toFixed(8)})
                    </p>
                  )}
                  {totalBtcAccumulated > 0 && unallocatedBtc > 0 && !isAmountOverLimit && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-xs text-muted-foreground">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setNewAmount(unallocatedBtc.toFixed(8))}
                        className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        All ({unallocatedBtc.toFixed(4)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAmount((unallocatedBtc / 2).toFixed(8))}
                        className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAmount((unallocatedBtc / 4).toFixed(8))}
                        className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        25%
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address (optional)</Label>
                <Input
                  placeholder="bc1q..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowAddWallet(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddWallet} disabled={!canAddWallet}>
                  Add Wallet
                </Button>
              </div>
            </div>
          )}

          {/* Wallet List */}
          {wallets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <WalletIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No wallets added yet</p>
              <p className="text-xs mt-1">Track where your BTC is stored</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...wallets].sort((a, b) => b.btcAmount - a.btcAmount).map((wallet) => {
                const percentage = totalBtc > 0 ? (wallet.btcAmount / totalBtc) * 100 : 0
                const walletValue = currentPrice ? wallet.btcAmount * currentPrice : 0
                const isEditing = editingId === wallet.id

                return (
                  <div
                    key={wallet.id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/50 relative overflow-hidden group"
                  >
                    {/* Progress bar background */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative flex items-center justify-between gap-3">
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="h-8 w-32"
                              autoFocus
                            />
                            <Input
                              type="number"
                              step="0.00000001"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className={cn(
                                "h-8 w-36 font-mono",
                                getEditAmountOverLimit(wallet.btcAmount) && "border-destructive"
                              )}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => handleSaveEdit(wallet.id, wallet.btcAmount)}
                              disabled={getEditAmountOverLimit(wallet.btcAmount)}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                          {getEditAmountOverLimit(wallet.btcAmount) && (
                            <p className="text-xs text-destructive">
                              Max: {(unallocatedBtc + wallet.btcAmount).toFixed(8)} BTC
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{wallet.label}</p>
                              <span className="text-xs text-primary font-medium">{percentage.toFixed(1)}%</span>
                            </div>
                            {wallet.address && (
                              <button
                                onClick={() => handleCopyAddress(wallet)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                              >
                                <span className="font-mono">{shortenAddress(wallet.address)}</span>
                                {copiedId === wallet.id ? (
                                  <CheckCheck className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="font-mono font-medium">{wallet.btcAmount.toFixed(8)}</p>
                            {currentPrice && (
                              <p className="text-xs text-muted-foreground">
                                ${walletValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(wallet)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 hover:text-destructive"
                              onClick={() => handleOpenDeleteDialog(wallet)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this wallet?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {walletToDelete && (
                  <>
                    <p>
                      You are about to remove <span className="font-semibold text-foreground">{walletToDelete.label}</span> from tracking.
                    </p>
                    <p className="mt-2 font-mono text-foreground">
                      {walletToDelete.btcAmount.toFixed(8)} BTC
                    </p>
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
              Delete Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

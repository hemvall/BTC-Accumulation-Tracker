import { Support, Strategy, Purchase, Wallet, Sale } from './types'

const STORAGE_KEY = 'btc-dca-strategy'
const PURCHASES_KEY = 'btc-dca-purchases'
const WALLETS_KEY = 'btc-wallets'
const SALES_KEY = 'btc-sales'

export function getStrategy(): Strategy | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  return JSON.parse(stored)
}

export function saveStrategy(strategy: Strategy): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy))
}

export function getPurchases(): Purchase[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(PURCHASES_KEY)
  if (!stored) return []
  return JSON.parse(stored)
}

export function savePurchase(purchase: Purchase): void {
  if (typeof window === 'undefined') return
  const purchases = getPurchases()
  purchases.push(purchase)
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))
}

export function createDefaultStrategy(totalCapital: number): Strategy {
  return {
    totalCapital,
    remainingCapital: totalCapital,
    supports: [],
    totalBtc: 0,
    averagePrice: 0,
  }
}

export function addSupport(strategy: Strategy, price: number, allocation: number): Strategy {
  const support: Support = {
    id: crypto.randomUUID(),
    price,
    allocation,
    status: 'pending',
  }
  
  return {
    ...strategy,
    supports: [...strategy.supports, support].sort((a, b) => b.price - a.price),
  }
}

export function removeSupport(strategy: Strategy, supportId: string): Strategy {
  return {
    ...strategy,
    supports: strategy.supports.filter(s => s.id !== supportId),
  }
}

export function executePurchase(
  strategy: Strategy,
  supportId: string
): { strategy: Strategy; purchase: Purchase } {
  const support = strategy.supports.find(s => s.id === supportId)
  if (!support) throw new Error('Support not found')
  
  const amount = Math.min(support.allocation, strategy.remainingCapital)
  // Calculate BTC based on SUPPORT price (the price at which we're buying)
  const btcAmount = amount / support.price
  
  const updatedSupports = strategy.supports.map(s => 
    s.id === supportId
      ? { ...s, status: 'touched' as const, touchedAt: new Date(), btcBought: btcAmount, amountSpent: amount }
      : s
  )
  
  const newTotalBtc = strategy.totalBtc + btcAmount
  const newTotalInvested = strategy.totalCapital - strategy.remainingCapital + amount
  const newAveragePrice = newTotalInvested / newTotalBtc
  
  const purchase: Purchase = {
    id: crypto.randomUUID(),
    supportId,
    price: support.price, // Record the support price as buy price
    amount,
    btcAmount,
    date: new Date(),
  }
  
  return {
    strategy: {
      ...strategy,
      remainingCapital: strategy.remainingCapital - amount,
      supports: updatedSupports,
      totalBtc: newTotalBtc,
      averagePrice: newAveragePrice,
    },
    purchase,
  }
}

export function markSupportBroken(strategy: Strategy, supportId: string): Strategy {
  return {
    ...strategy,
    supports: strategy.supports.map(s =>
      s.id === supportId ? { ...s, status: 'broken' as const } : s
    ),
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(PURCHASES_KEY)
}

// Wallet functions
export function getWallets(): Wallet[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(WALLETS_KEY)
  if (!stored) return []
  return JSON.parse(stored)
}

export function saveWallets(wallets: Wallet[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
}

export function addWallet(label: string, address: string, btcAmount: number): Wallet {
  const wallet: Wallet = {
    id: crypto.randomUUID(),
    label,
    address,
    btcAmount,
  }
  const wallets = getWallets()
  wallets.push(wallet)
  saveWallets(wallets)
  return wallet
}

export function updateWallet(walletId: string, updates: Partial<Omit<Wallet, 'id'>>): void {
  const wallets = getWallets()
  const updated = wallets.map(w => 
    w.id === walletId ? { ...w, ...updates } : w
  )
  saveWallets(updated)
}

export function removeWallet(walletId: string): void {
  const wallets = getWallets()
  saveWallets(wallets.filter(w => w.id !== walletId))
}

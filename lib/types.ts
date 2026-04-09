export interface Support {
  id: string
  price: number
  allocation: number
  status: 'pending' | 'touched' | 'broken'
  touchedAt?: Date
  btcBought?: number
  amountSpent?: number
}

export interface Strategy {
  totalCapital: number
  remainingCapital: number
  supports: Support[]
  totalBtc: number
  averagePrice: number
}

export interface Purchase {
  id: string
  supportId: string
  price: number
  amount: number
  btcAmount: number
  date: Date
}

export interface Wallet {
  id: string
  label: string
  address: string
  btcAmount: number
}

export interface Sale {
  id: string
  btcAmount: number
  pricePerBtc: number
  totalUsd: number
  date: Date
  note?: string
}

"use client"

import { useBitcoinPrice } from "@/hooks/use-bitcoin-price"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BitcoinPriceDisplay() {
  const { price, isLoading, refresh } = useBitcoinPrice()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">BTC/USD</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            isLoading && "animate-pulse"
          )}
        >
          {price ? `$${price.toLocaleString("en-US")}` : "---"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refresh()}
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoading && "animate-spin")}
          />
          <span className="sr-only">Refresh price</span>
        </Button>
      </div>
    </div>
  )
}

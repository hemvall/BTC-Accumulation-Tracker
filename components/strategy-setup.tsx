"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Target, Plus, Trash2 } from "lucide-react"
import { Strategy, Support } from "@/lib/types"
import { createDefaultStrategy, addSupport } from "@/lib/store"

interface StrategySetupProps {
  onComplete: (strategy: Strategy) => void
  currentPrice: number | null
}

export function StrategySetup({ onComplete, currentPrice }: StrategySetupProps) {
  const [step, setStep] = useState(1)
  const [totalCapital, setTotalCapital] = useState("")
  const [supports, setSupports] = useState<Array<{ price: string; allocation: string }>>([
    { price: "", allocation: "" }
  ])

  const suggestedSupports = currentPrice
    ? [
        Math.round(currentPrice * 0.95),
        Math.round(currentPrice * 0.85),
        Math.round(currentPrice * 0.75),
        Math.round(currentPrice * 0.65),
      ]
    : []

  const addSupportField = () => {
    setSupports([...supports, { price: "", allocation: "" }])
  }

  const removeSupportField = (index: number) => {
    setSupports(supports.filter((_, i) => i !== index))
  }

  const updateSupport = (index: number, field: "price" | "allocation", value: string) => {
    const updated = [...supports]
    updated[index][field] = value
    setSupports(updated)
  }

  const handleSubmit = () => {
    let strategy = createDefaultStrategy(parseFloat(totalCapital))
    
    supports.forEach(s => {
      if (s.price && s.allocation) {
        strategy = addSupport(strategy, parseFloat(s.price), parseFloat(s.allocation))
      }
    })
    
    onComplete(strategy)
  }

  const totalAllocated = supports.reduce((sum, s) => sum + (parseFloat(s.allocation) || 0), 0)
  const capitalNum = parseFloat(totalCapital) || 0
  const isValid = capitalNum > 0 && supports.some(s => s.price && s.allocation) && totalAllocated <= capitalNum

  const useSuggestedSupport = (price: number, index: number) => {
    const updated = [...supports]
    updated[index].price = price.toString()
    setSupports(updated)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {step === 1 ? (
              <DollarSign className="h-6 w-6 text-primary" />
            ) : (
              <Target className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Define Your Capital" : "Set Your Support Zones"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "How much do you want to deploy for Bitcoin accumulation?"
              : "Define price levels where you want to buy"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Total Capital (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="capital"
                    type="number"
                    placeholder="5,000"
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(e.target.value)}
                    className="pl-9 text-lg h-12"
                  />
                </div>
              </div>
              <Button
                className="w-full h-12"
                disabled={!totalCapital || parseFloat(totalCapital) <= 0}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capital: ${capitalNum.toLocaleString()}</span>
                <span className={totalAllocated > capitalNum ? "text-destructive" : "text-muted-foreground"}>
                  Allocated: ${totalAllocated.toLocaleString()}
                </span>
              </div>

              {supports.map((support, index) => (
                <div key={index} className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Support #{index + 1}</span>
                    {supports.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSupportField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price Level</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="65,000"
                          value={support.price}
                          onChange={(e) => updateSupport(index, "price", e.target.value)}
                          className="pl-7 h-10"
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
                          value={support.allocation}
                          onChange={(e) => updateSupport(index, "allocation", e.target.value)}
                          className="pl-7 h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {suggestedSupports.length > 0 && !support.price && (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSupports.map((price) => (
                        <button
                          key={price}
                          onClick={() => useSuggestedSupport(price, index)}
                          className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          ${price.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed bg-transparent"
                onClick={addSupportField}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Support Zone
              </Button>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!isValid}
                  onClick={handleSubmit}
                >
                  Start Tracking
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

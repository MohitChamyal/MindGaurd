"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

interface RewardPopupProps {
  points: number
  onClose: () => void
}

export function RewardPopup({ points, onClose }: RewardPopupProps) {
  const [timeRemaining, setTimeRemaining] = useState(10)

  useEffect(() => {
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      })
    } catch (error) {
      console.error("Error creating confetti:", error)
    }

    return () => {
      // Cleanup function
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Auto-closing reward popup after timeout")
      onClose()
    }, 8000)

    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(countdownInterval)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-2 border-purple-200 dark:border-purple-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            You've earned a reward!
          </h2>
          <p className="text-center text-muted-foreground">
            Great job completing your task! You've earned:
          </p>
          <div className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            {points} points
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Keep up the good work to maintain your streak!
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Continue ({timeRemaining}s)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


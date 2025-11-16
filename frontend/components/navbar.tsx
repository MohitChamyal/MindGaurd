"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Trophy, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface NavbarProps {
  points: number
  streak: number
}

export function Navbar({ points, streak }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Calculate level based on points
  const level = Math.floor(points / 100) + 1

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-pulse" />
            <div className="absolute inset-0.5 bg-background rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{level}</span>
            </div>
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            MindTrack
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
              "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-500",
            )}
          >
            <Trophy size={18} className="text-yellow-500" />
            <span className="font-semibold">{points} pts</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
              "bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-500",
            )}
          >
            <Flame size={18} className="text-orange-500" />
            <span className="font-semibold">{streak} days</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}


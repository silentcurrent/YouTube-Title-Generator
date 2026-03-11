"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TitleResultsProps {
  titles: string[]
}

export function TitleResults({ titles }: TitleResultsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (title: string, index: number) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  if (titles.length === 0) return null

  const [explanation, ...titleList] = titles

  return (
    <div className="w-full space-y-4">
      <div className="grid gap-3">
        {explanation && (
          <div className="rounded-xl p-4 bg-muted/50 border border-border">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
        )}
        {titleList.map((title, index) => (
          <div
            key={index}
            className={cn(
              "group relative flex items-center justify-between gap-4 rounded-xl p-4",
              "bg-card border border-border",
              "transition-all duration-200 hover:border-primary/50 hover:bg-card/80",
              "hover:shadow-lg hover:shadow-primary/5"
            )}
          >
            <p className="flex-1 text-card-foreground font-medium leading-relaxed">
              {title}
            </p>
            <button
              onClick={() => copyToClipboard(title, index)}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                "bg-secondary text-secondary-foreground",
                "transition-all duration-200",
                "hover:bg-primary hover:text-primary-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              aria-label="Copy title"
            >
              {copiedIndex === index ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

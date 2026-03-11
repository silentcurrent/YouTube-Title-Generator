"use client"

import { useState, useCallback } from "react"
import { Sparkles, Loader2, Youtube } from "lucide-react"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { TitleResults } from "@/components/TitleResults"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function Home() {
  const [textInput, setTextInput] = useState("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [titles, setTitles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Reset state for continuous generation
  const handleModalClose = useCallback((open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      // Clear previous results when modal closes to allow fresh generation
      setTitles([])
      setTextInput("")
      setError(null)
    }
  }, [])

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setAudioBlob(blob)
    setError(null)
    
    // Auto-generate titles when recording is complete
    setIsLoading(true)
    setTitles([])

    try {
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")
      // Also include text if available
      if (textInput.trim()) {
        formData.append("text", textInput.trim())
      }

      const response = await fetch("https://hustlexxx.app.n8n.cloud/webhook/voice-storm", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate titles")
      }

      // Handle response - n8n may return titles in different formats
      const generatedTitles = data.titles || data.output || (Array.isArray(data) ? data : [])
      setTitles(generatedTitles)
      setAudioBlob(null)
      setIsModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [textInput])

  const handleGenerateTitles = async () => {
    if (!textInput.trim() && !audioBlob) {
      setError("Please enter text or record your voice first")
      return
    }

    setIsLoading(true)
    setError(null)
    setTitles([])

    try {
      const formData = new FormData()
      if (textInput.trim()) {
        formData.append("text", textInput.trim())
      }
      if (audioBlob) {
        formData.append("audio", audioBlob, "recording.webm")
      }

      const response = await fetch("https://hustlexxx.app.n8n.cloud/webhook/voice-storm", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate titles")
      }

      // Handle response - n8n may return titles in different formats
      const generatedTitles = data.titles || data.output || (Array.isArray(data) ? data : [])
      setTitles(generatedTitles)
      setAudioBlob(null)
      setIsModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-primary/15 blur-[100px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent/15 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Youtube className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Tool</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
            YouTube Title Generator
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Speak or type your idea and generate powerful YouTube titles that drive clicks and engagement.
          </p>
        </header>

        {/* Main Input Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg shadow-primary/5">
            {/* Voice Recorder */}
            <div className="mb-8">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isDisabled={isLoading}
              />
              {audioBlob && !isLoading && (
                <p className="text-center text-sm text-primary mt-2">
                  Audio ready. You can also use the button below to generate with text.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or type your idea</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value)
                  setError(null)
                }}
                placeholder="Type your video topic or idea..."
                disabled={isLoading}
                className={cn(
                  "w-full min-h-[120px] p-4 rounded-xl resize-none",
                  "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Example: &ldquo;How to grow a YouTube channel in 2026&rdquo;
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateTitles}
              disabled={isLoading || (!textInput.trim() && !audioBlob)}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Titles...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Titles
                </>
              )}
            </Button>
          </div>

          </div>

        {/* Footer */}
        <footer className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            Powered by AI • Built for content creators
          </p>
        </footer>
      </div>

      {/* Results Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              Generated Titles
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <TitleResults titles={titles} />
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={() => handleModalClose(false)}
              className="w-full"
              variant="outline"
            >
              Record Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

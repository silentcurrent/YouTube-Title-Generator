"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  isDisabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
  }, [])

  // Analyze audio levels for visualization
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average volume level (0-1)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    const normalizedLevel = Math.min(average / 128, 1)
    setAudioLevel(normalizedLevel)

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [])

  const startRecording = useCallback(async () => {
    if (isDisabled) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analysis for visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start analyzing audio levels
      analyzeAudio()

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
          onRecordingComplete(audioBlob)
        }
        cleanup()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      cleanup()
    }
  }, [onRecordingComplete, analyzeAudio, cleanup, isDisabled])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // Handle pointer events for press-and-hold
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    if (!isDisabled && !isRecording) {
      startRecording()
    }
  }, [isDisabled, isRecording, startRecording])

  const handlePointerUp = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }
  }, [isRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Generate wave bars based on audio level
  const waveBars = Array.from({ length: 5 }, (_, i) => {
    const baseHeight = 8
    const maxAdditionalHeight = 32
    const delay = i * 0.05
    const levelMultiplier = Math.sin((Date.now() / 100 + i) * 0.5) * 0.3 + 0.7
    const height = baseHeight + (audioLevel * maxAdditionalHeight * levelMultiplier)
    return { height, delay }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Audio level visualization */}
      <div className="flex items-center justify-center gap-1 h-16 mb-2">
        {isRecording ? (
          waveBars.map((bar, i) => (
            <div
              key={i}
              className="w-2 bg-primary rounded-full transition-all duration-75"
              style={{
                height: `${bar.height}px`,
                opacity: 0.5 + audioLevel * 0.5,
              }}
            />
          ))
        ) : (
          <div className="text-muted-foreground text-sm">Hold to record</div>
        )}
      </div>

      {/* Record button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={isDisabled}
        className={cn(
          "relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-200 select-none touch-none",
          "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95",
          isRecording && "bg-primary border-primary scale-110"
        )}
        aria-label={isRecording ? "Release to generate" : "Hold to record"}
      >
        {isRecording ? (
          <>
            {/* Pulsing rings based on audio level */}
            <div 
              className="absolute rounded-full bg-primary/30 transition-all duration-75"
              style={{
                inset: `${-8 - audioLevel * 16}px`,
                opacity: 0.3 + audioLevel * 0.4,
              }}
            />
            <div 
              className="absolute rounded-full bg-primary/20 transition-all duration-75"
              style={{
                inset: `${-16 - audioLevel * 24}px`,
                opacity: 0.2 + audioLevel * 0.3,
              }}
            />
            <Mic className="relative z-10 h-10 w-10 text-primary-foreground" />
          </>
        ) : (
          <Mic className="h-10 w-10 text-primary" />
        )}
      </button>

      {/* Status text */}
      <p className="text-sm text-muted-foreground text-center">
        {isRecording ? (
          <span className="text-primary font-medium">Recording... Release to generate</span>
        ) : (
          "Hold the button and speak your idea"
        )}
      </p>
    </div>
  )
}

"use client"

import { useState, useRef, useCallback } from "react"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  isDisabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        onRecordingComplete(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggleRecording}
        disabled={isDisabled}
        className={cn(
          "relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300",
          "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isRecording && "bg-primary border-primary"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <>
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
            <div className="absolute inset-3 rounded-full animate-pulse bg-primary/30" />
            <MicOff className="relative z-10 h-10 w-10 text-primary-foreground" />
          </>
        ) : (
          <Mic className="h-10 w-10 text-primary" />
        )}
      </button>
      <p className="text-sm text-muted-foreground">
        {isRecording ? "Recording... Click to stop" : "Click to record your idea"}
      </p>
    </div>
  )
}

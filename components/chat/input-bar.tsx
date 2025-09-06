"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

export function InputBar({
  onSend,
  onSimplify,
  large,
  sttEnabled = true,
}: {
  onSend: (content: string) => Promise<void>
  onSimplify: (content: string) => Promise<void>
  large?: boolean
  sttEnabled?: boolean
}) {
  const [value, setValue] = useState("")
  const [recording, setRecording] = useState(false)
  const [micHint, setMicHint] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const startingRef = useRef(false)

  const secure =
    typeof window !== "undefined" && "isSecureContext" in window
      ? (window as any).isSecureContext === true
      : false

  const canSTT =
    typeof window !== "undefined" &&
    secure &&
    (("SpeechRecognition" in window && !!(window as any).SpeechRecognition) ||
      ("webkitSpeechRecognition" in window && !!(window as any).webkitSpeechRecognition))

  useEffect(() => {
    if (!secure) {
      setMicHint("Voice input needs HTTPS (secure context).")
      return
    }
    if (!canSTT) {
      setMicHint("Voice input not supported in this browser.")
      return
    }
    setMicHint(null)

    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.lang = "en-US"
    recog.interimResults = false
    recog.continuous = false

    recog.onstart = () => {
      console.log("🎤 SpeechRecognition started")
      setRecording(true)
    }
    recog.onresult = (e: any) => {
      const transcript = e?.results?.[0]?.[0]?.transcript ?? ""
      console.log("📝 Transcript:", transcript)
      setValue((prev) => (prev ? prev + " " + transcript : transcript))
    }
    recog.onerror = (e: any) => {
      const err = e?.error || "mic error"
      console.error("❌ SpeechRecognition error:", err)
      const msg =
        err === "not-allowed"
          ? "Microphone permission was denied."
          : err === "no-speech"
          ? "No speech detected. Try again."
          : err === "network"
          ? "Voice input error: network. Check your internet connection or try again in a moment."
          : `Voice input error: ${err}`
      setMicHint(msg)
      setRecording(false)
      startingRef.current = false
    }
    recog.onend = () => {
      console.log("🛑 SpeechRecognition ended")
      setRecording(false)
      startingRef.current = false
    }

    recognitionRef.current = recog
    console.log("[Project Deoxys] STT ready:", { secure, canSTT })
  }, [secure, canSTT])

  const handleMic = useCallback(() => {
    if (!sttEnabled) {
      setMicHint("Voice input is turned off in settings.")
      return
    }
    if (!recognitionRef.current) {
      setMicHint(canSTT ? "Mic not ready yet. Wait a moment." : "Voice input not supported.")
      return
    }
    try {
      if (!recording) {
        if (startingRef.current) return
        startingRef.current = true
        setMicHint(null)
        console.log("▶️ Starting SpeechRecognition...")
        recognitionRef.current.start()
      } else {
        console.log("⏹️ Stopping SpeechRecognition...")
        recognitionRef.current.stop()
      }
    } catch (e: any) {
      console.error("⚠️ handleMic exception:", e)
      setRecording(false)
      startingRef.current = false
      setMicHint(`Voice input error: ${e?.message || "could not access microphone"}`)
    }
  }, [recording, sttEnabled, canSTT])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = value.trim()
    if (!text) return
    setValue("")
    await onSend(text)
  }

  const handleSimplify = async () => {
    const text = value.trim()
    if (!text) return
    await onSimplify(text)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
      <label htmlFor="chat-input" className="sr-only">
        Chat input
      </label>
      <textarea
        id="chat-input"
        aria-label="Type your message"
        className={`w-full resize-none rounded-md border p-3 leading-relaxed focus:outline-none focus:ring-2 ${
          large ? "text-lg" : "text-base"
        }`}
        style={{ borderColor: "var(--border-c)" }}
        rows={2}
        placeholder="Type your message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void handleSubmit()
          }
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={recording ? "Stop recording" : "Start recording"}
          onClick={handleMic}
          className={`rounded-md px-3 py-2 border ${
            recording
              ? "bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
              : "bg-[color:var(--panel-bg)]"
          }`}
          style={{ borderColor: "var(--border-c)" }}
          title={!sttEnabled ? "Voice input disabled" : "Voice input"}
        >
          {recording ? "Stop" : "Mic"}
        </button>

        <button
          type="button"
          onClick={handleSimplify}
          className="rounded-md px-3 py-2 border bg-[color:var(--panel-bg)]"
          style={{ borderColor: "var(--border-c)" }}
          aria-label="Simplify this text"
          title="Simplify This Text"
        >
          Simplify
        </button>
        <button
          type="submit"
          className="rounded-md px-4 py-2 bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
      {micHint && (
        <p className="text-xs opacity-80" role="status" aria-live="polite">
          {micHint}
        </p>
      )}
    </form>
  )
}

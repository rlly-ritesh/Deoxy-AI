 "use client"

import { useEffect, useRef, useState } from "react"
import { MessageBubble } from "./message-bubble"
import { InputBar } from "./input-bar"
import { speakText } from "../../utils/voice" // use expressive female TTS
import CameraAdjust from "../CameraAdjust" // <-- CORRECT PATH

type Prefs = {
  theme: "cream" | "pastel" | "dark"
  largeText: boolean
  brightness: number
  contrast: number
  ttsOn: boolean
  sttEnabled: boolean
}
type Message = { role: "user" | "assistant"; content: string }

async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {
    // ignore parse errors
  }
  if (!res.ok) {
    const msg = data?.error || `Request failed: ${res.status}`
    throw new Error(msg)
  }
  return data
}

export function ChatWindow({ prefs }: { prefs: Prefs }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi. I can help.\n\n- Short answers.\n- Simple words.\n- Clear steps.\n\nHow can I help today?",
    },
  ])
  const [pending, setPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // Text-to-Speech for assistant messages
  useEffect(() => {
    if (!prefs.ttsOn) return
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== "assistant") return
    void speakText(last.content, { rate: 0.98, pitch: 1.12, volume: 1.0, lang: "en-US" })
  }, [messages, prefs.ttsOn])

  const sendUserMessage = async (content: string) => {
    const next = [...messages, { role: "user" as const, content }]
    setMessages(next)
    setPending(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {}
      if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`)
      const reply = typeof data?.text === "string" ? data.text : "Sorry, I could not generate a reply."
      setMessages((prev) => [...prev, { role: "assistant" as const, content: reply }])
      if (data?.provider) console.log("[Project Deoxys] Chat provider (client):", data.provider)
    } catch (e: any) {
      console.log("[Project Deoxys] Chat API error:", e?.message)
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: e?.message || "Sorry. There was an error. Please try again." },
      ])
    } finally {
      clearTimeout(timeout)
      setPending(false)
    }
  }

  const simplifyText = async (content: string) => {
    setPending(true)
    try {
      const data = await postJSON("/api/chat", {
        messages: [{ role: "user", content }],
        simplifyMode: true,
      })
      setMessages((prev) => [...prev, { role: "user" as const, content }, { role: "assistant" as const, content: data.text }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: e?.message || "Could not simplify. Try again." }])
    } finally {
      setPending(false)
    }
  }
  console.log("✅ Rendering InputBar inside ChatWindow", prefs)

  return (
    <div
      className="w-full rounded-xl border shadow-sm"
      style={{
        backgroundColor: "var(--panel-bg)",
        color: "var(--fg)",
        borderColor: "var(--border-c)",
      }}
    >
      <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-c)" }}>
        <h1 className={`text-balance font-bold ${prefs.largeText ? "text-2xl" : "text-xl"}`}>
          Deoxy AI
        </h1>
        <span className="text-xs opacity-80">Font: OpenDyslexic</span>
      </header>

      <main
        ref={scrollRef}
        className="h-[420px] overflow-y-auto p-4 flex flex-col gap-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.content} large={prefs.largeText} />
        ))}
        {pending && (
          <div className="text-sm opacity-80" role="status" aria-live="polite">
            Thinking…
          </div>
        )}
      </main>

       <footer className="p-4 border-t" style={{ borderColor: "var(--border-c)" }}>
  {/* Camera Controls */}
  <div className="mb-3">
    <CameraAdjust />
  </div>

  {/* Input Bar */}
  <InputBar
    onSend={sendUserMessage}
    onSimplify={simplifyText}
    large={prefs.largeText}
    sttEnabled={prefs.sttEnabled}
  />
</footer>
    </div>
  )
}
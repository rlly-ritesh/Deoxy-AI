"use client"

import { useEffect, useState } from "react"
import { AccessibilityPanel, type Preferences } from "@/components/accessibility-panel"
import { ChatWindow } from "@/components/chat/chat-window"
import ImageGen from "@/components/image-gen"

const DEFAULT_PREFS: Preferences = {
  theme: "cream",
  largeText: true,
  brightness: 1,
  contrast: 1,
  ttsOn: true,
  sttEnabled: true,
  bgHex: null, // support custom background
}

export default function HomePage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("prefs:dyslexia-ai")
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  return (
    <div
      // Full-page background and filters
      data-theme={prefs.theme}
      className="min-h-svh w-full" // svh for mobile address bar correctness
      style={{
        filter: `brightness(${prefs.brightness}) contrast(${prefs.contrast})`,
        backgroundColor: prefs.bgHex || "var(--bg)",
        color: "var(--fg)",
      }}
    >
      <main className="mx-auto max-w-3xl p-4 md:p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className={`text-balance font-bold ${prefs.largeText ? "text-2xl" : "text-xl"}`}>
            Deoxy AI  — Dyslexia‑Friendly ChatBot
          </h1>
          <nav className="flex items-center gap-3 text-sm">
            <a className="underline opacity-90 hover:opacity-100" href="/login">
              Log in
            </a>
            <a className="underline opacity-90 hover:opacity-100" href="/signup">
              Sign up
            </a>
          </nav>
        </header>

        <AccessibilityPanel onChange={setPrefs} />

        <ChatWindow prefs={prefs} />

        <ImageGen />

        <section className="text-sm opacity-80">
          <p> Deoxy AI : Made by Team LogicBots</p>
        </section>
      </main>
    </div>
  )
}

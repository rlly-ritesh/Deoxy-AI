"use client"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type React from "react"

type Theme = "cream" | "pastel" | "dark"

type ThemeState = {
  theme: Theme
  setTheme: (t: Theme) => void
  brightness: number
  setBrightness: (v: number) => void
  contrast: number
  setContrast: (v: number) => void
  bgCustom: string | null
  setBgCustom: (hex: string | null) => void
  largeText: boolean
  setLargeText: (v: boolean) => void
  ttsEnabled: boolean
  setTtsEnabled: (v: boolean) => void
  sttEnabled: boolean
  setSttEnabled: (v: boolean) => void
}

const ThemeCtx = createContext<ThemeState | null>(null)

export function useThemeSettings() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error("useThemeSettings must be used within ThemeProvider")
  return ctx
}

const LS_KEY = "dfc:settings"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("cream")
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [bgCustom, setBgCustom] = useState<string | null>(null)
  const [largeText, setLargeText] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [sttEnabled, setSttEnabled] = useState(true)

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s.theme) setTheme(s.theme)
        if (typeof s.brightness === "number") setBrightness(s.brightness)
        if (typeof s.contrast === "number") setContrast(s.contrast)
        if (typeof s.largeText === "boolean") setLargeText(s.largeText)
        if (typeof s.ttsEnabled === "boolean") setTtsEnabled(s.ttsEnabled)
        if (typeof s.sttEnabled === "boolean") setSttEnabled(s.sttEnabled)
        if (typeof s.bgCustom === "string" || s.bgCustom === null) setBgCustom(s.bgCustom)
      }
    } catch {}
  }, [])

  // Persist and apply to document
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    root.style.setProperty("--brightness", String(brightness))
    root.style.setProperty("--contrast", String(contrast))
    if (bgCustom) {
      root.style.setProperty("--bg-custom", bgCustom)
    } else {
      root.style.removeProperty("--bg-custom")
    }
    document.body.style.fontSize = largeText ? "18px" : ""
    try {
      const toSave = { theme, brightness, contrast, bgCustom, largeText, ttsEnabled, sttEnabled }
      localStorage.setItem(LS_KEY, JSON.stringify(toSave))
    } catch {}
  }, [theme, brightness, contrast, bgCustom, largeText, ttsEnabled, sttEnabled])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      brightness,
      setBrightness,
      contrast,
      setContrast,
      bgCustom,
      setBgCustom,
      largeText,
      setLargeText,
      ttsEnabled,
      setTtsEnabled,
      sttEnabled,
      setSttEnabled,
    }),
    [theme, brightness, contrast, bgCustom, largeText, ttsEnabled, sttEnabled],
  )

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

"use client"

import { useEffect, useState } from "react"

type Theme = "cream" | "pastel" | "dark"
export type Preferences = {
  theme: Theme
  largeText: boolean
  brightness: number
  contrast: number
  ttsOn: boolean
  sttEnabled: boolean
  bgHex: string | null //
}

const DEFAULT_PREFS: Preferences = {
  theme: "cream",
  largeText: true,
  brightness: 1,
  contrast: 1,
  ttsOn: true,
  sttEnabled: true,
  bgHex: null, //
}

export function AccessibilityPanel({ onChange }: { onChange: (p: Preferences) => void }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("prefs:dyslexia-ai")
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("prefs:dyslexia-ai", JSON.stringify(prefs))
    } catch {}
    onChange(prefs)
  }, [prefs, onChange])

  return (
    <section
      className="w-full rounded-lg border bg-[color:var(--panel-bg)] p-4 text-sm"
      style={{ borderColor: "var(--border-c)" }}
      aria-label="Accessibility settings"
    >
      <h2 className="text-base font-bold mb-3">Accessibility</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Background</label>
          <div className="flex gap-2">
            {(["cream", "pastel", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                className={`rounded-md px-3 py-2 border ${
                  prefs.theme === t
                    ? "bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
                    : "bg-[color:var(--panel-bg)]"
                }`}
                style={{ borderColor: "var(--border-c)" }}
                aria-pressed={prefs.theme === t}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pref-large" className="font-medium">
            Large text
          </label>
          <input
            id="pref-large"
            type="checkbox"
            checked={prefs.largeText}
            onChange={(e) => setPrefs((p) => ({ ...p, largeText: e.target.checked }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pref-bright" className="font-medium">
            Brightness ({prefs.brightness.toFixed(2)})
          </label>
          <input
            id="pref-bright"
            type="range"
            min={0.75}
            max={1.25}
            step={0.01}
            value={prefs.brightness}
            onChange={(e) => setPrefs((p) => ({ ...p, brightness: Number(e.target.value) }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pref-contrast" className="font-medium">
            Contrast ({prefs.contrast.toFixed(2)})
          </label>
          <input
            id="pref-contrast"
            type="range"
            min={0.75}
            max={1.25}
            step={0.01}
            value={prefs.contrast}
            onChange={(e) => setPrefs((p) => ({ ...p, contrast: Number(e.target.value) }))}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pref-tts" className="font-medium">
            Read replies aloud
          </label>
          <input
            id="pref-tts"
            type="checkbox"
            checked={prefs.ttsOn}
            onChange={(e) => setPrefs((p) => ({ ...p, ttsOn: e.target.checked }))}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pref-stt" className="font-medium">
            Voice input
          </label>
          <input
            id="pref-stt"
            type="checkbox"
            checked={prefs.sttEnabled}
            onChange={(e) => setPrefs((p) => ({ ...p, sttEnabled: e.target.checked }))}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor="pref-bgcolor" className="font-medium">
            Background color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="pref-bgcolor"
              type="color"
              value={prefs.bgHex ?? "#ffffff"}
              onChange={(e) => setPrefs((p) => ({ ...p, bgHex: e.target.value }))}
              aria-label="Pick a background color"
              title="Pick a background color"
            />
            <button
              type="button"
              className="rounded-md px-2 py-1 border bg-[color:var(--panel-bg)] text-xs"
              style={{ borderColor: "var(--border-c)" }}
              onClick={() => setPrefs((p) => ({ ...p, bgHex: null }))}
              aria-label="Reset background color"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

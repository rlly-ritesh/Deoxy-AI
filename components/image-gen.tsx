"use client"
import { useState } from "react"

export default function ImageGen() {
  const [prompt, setPrompt] = useState("")
  const [img, setImg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    const p = prompt.trim()
    if (!p) return
    setBusy(true)
    setError(null)
    setImg(null)
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, size: "512x512" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Image generation failed")
      setImg(data.image)
    } catch (e: any) {
      setError(e?.message || "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="w-full rounded-lg border p-4"
      style={{ backgroundColor: "var(--panel-bg)", borderColor: "var(--border-c)", color: "var(--fg)" }}
      aria-label="Image generator"
    >
      <h2 className="text-xl font-bold mb-3">Image Generator</h2>
      <div className="space-y-2">
        <label htmlFor="img-prompt" className="sr-only">
          Image prompt
        </label>
        <textarea
          id="img-prompt"
          className="w-full resize-y rounded-md border p-3 leading-relaxed"
          style={{ borderColor: "var(--border-c)", backgroundColor: "var(--panel-bg)", color: "var(--fg)" }}
          rows={3}
          placeholder="Describe the image you want..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded-md px-3 py-2 bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
            onClick={generate}
            disabled={busy}
          >
            {busy ? "Generating..." : "Generate"}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        {img && (
          <div className="mt-3">
            <img
              src={img || "/placeholder.svg"}
              alt="Generated"
              className="w-full max-w-sm rounded-md border"
              style={{ borderColor: "var(--border-c)" }}
            />
          </div>
        )}
      </div>
    </section>
  )
}

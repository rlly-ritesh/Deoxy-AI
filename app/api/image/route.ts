import { type NextRequest, NextResponse } from "next/server"

function parseSize(size?: string) {
  const def = { w: 512, h: 512 }
  if (!size || typeof size !== "string") return def
  const match = size.match(/^(\d+)x(\d+)$/i)
  if (!match) return def
  const w = Math.max(64, Math.min(2048, Number.parseInt(match[1], 10)))
  const h = Math.max(64, Math.min(2048, Number.parseInt(match[2], 10)))
  return { w, h }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, size } = await req.json()
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 })
    }

    const { w, h } = parseSize(size)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&n=1`

    const resp = await fetch(url, { cache: "no-store" })
    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "")
      console.log("[Project Deoxys] Pollinations error:", resp.status, errTxt)
      return NextResponse.json({ error: "Image generation failed." }, { status: 500 })
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg"
    const arr = await resp.arrayBuffer()
    // Convert to base64 data URL to match existing UI expectations
    // Buffer is available in Next.js server runtime
    const base64 = Buffer.from(arr).toString("base64")
    const dataUrl = `data:${contentType};base64,${base64}`

    console.log("[Project Deoxys] Image provider: pollinations", { w, h })
    return NextResponse.json({ image: dataUrl })
  } catch (err: any) {
    console.log("[Project Deoxys] Image route error:", err?.message || err)
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}

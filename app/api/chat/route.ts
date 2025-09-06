import { NextResponse, type NextRequest } from "next/server"
import { DYSLEXIA_SYSTEM_PROMPT, SIMPLIFY_SYSTEM_PROMPT } from "@/lib/system-prompt"

function simpleSimplify(input: string) {
  const text = (input || "").replace(/\s+/g, " ").trim()
  if (!text) return "No text to simplify."
  const parts = text.split(/(?<=[.!?])\s+/).slice(0, 6)
  const bullets = parts.map((s) => "- " + s.replace(/[;:(),]/g, "").trim())
  return bullets.join("\n")
}

function withTimeout<T>(p: Promise<T>, ms = 30000): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  return Promise.race([
    p.catch((e) => {
      throw e
    }),
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Request timed out")), ms)),
  ]).finally(() => clearTimeout(t)) as Promise<T>
}

async function tryPollinations(prompt: string) {
  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`
    const resp = await withTimeout(fetch(url, { method: "GET" }), 30000)
    if (!resp.ok) {
      const err = await resp.text().catch(() => "")
      console.log("[Project Deoxys] Pollinations text error:", resp.status, err)
      return null
    }
    const text = (await resp.text()).trim()
    if (!text) return null
    return { provider: "pollinations:text", text }
  } catch (e: any) {
    console.log("[Project Deoxys] Pollinations text fetch failed:", e?.message || e)
    return null
  }
}

async function tryHuggingFace(prompt: string) {
  const hfKey = (process.env.HF_ACCESS_TOKEN || "").trim()
  if (!hfKey) return null
  const configured = (process.env.HF_CHAT_MODEL || "mistralai/Mistral-7B-Instruct-v0.2").trim()
  const candidates = [configured, "HuggingFaceH4/zephyr-7b-beta", "google/gemma-2b-it"]
  const parameters = { max_new_tokens: 200, temperature: 0.4, return_full_text: false }

  for (const model of candidates) {
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}?wait_for_model=true`
    const body = { inputs: prompt, parameters, options: { wait_for_model: true, use_cache: true } }
    for (let attempt = 1; attempt <= 2; attempt++) {
      let resp: Response
      try {
        resp = await withTimeout(
          fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
          30000,
        )
      } catch (e: any) {
        console.log("[Project Deoxys] HF network error:", model, e?.message || e)
        break
      }
      if (resp.status === 503) {
        console.log("[Project Deoxys] HF 503 (warming):", model)
        await new Promise((r) => setTimeout(r, 1500))
        continue
      }
      if (resp.status === 401) {
        const err = await resp.text().catch(() => "")
        console.log("[Project Deoxys] HF unauthorized:", err)
        return null
      }
      if (resp.status === 404) {
        console.log("[Project Deoxys] HF 404 model:", model)
        break
      }
      if (!resp.ok) {
        const err = await resp.text().catch(() => "")
        console.log("[Project Deoxys] HF error:", model, resp.status, err)
        break
      }
      const json = await resp.json().catch(() => null as any)
      let text = ""
      if (Array.isArray(json) && json[0]?.generated_text) text = json[0].generated_text
      else if (json?.generated_text) text = json.generated_text
      else if (Array.isArray(json) && json[0]?.summary_text) text = json[0].summary_text
      else if (typeof json === "string") text = json
      text = (text || "").trim()
      if (!text) {
        console.log("[Project Deoxys] HF empty:", model)
        break
      }
      console.log("[Project Deoxys] Chat provider: huggingface", model)
      return { provider: `huggingface:${model}`, text }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { messages, simplifyMode } = await req.json()
    const system = simplifyMode ? SIMPLIFY_SYSTEM_PROMPT : DYSLEXIA_SYSTEM_PROMPT
    const prompt = simplifyMode
      ? `${system}\n\nSimplify this:\n\n${messages?.[0]?.content ?? ""}`
      : `${system}\n\n${
          (messages as Array<{ role: string; content: string }>)
            ?.map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n") || "USER: Hello!"
        }`

    const hf = await tryHuggingFace(prompt)
    if (hf?.text) return NextResponse.json({ text: hf.text, provider: hf.provider })

    const poll = await tryPollinations(prompt)
    if (poll?.text) return NextResponse.json({ text: poll.text, provider: poll.provider })

    const reason = "No provider responded. Checked Hugging Face (HF_ACCESS_TOKEN/HF_CHAT_MODEL) then Pollinations."
    const demo = simplifyMode
      ? simpleSimplify(messages?.[0]?.content ?? "")
      : "Demo mode is on.\n\n- Set HF_ACCESS_TOKEN (and optional HF_CHAT_MODEL: mistralai/Mistral-7B-Instruct-v0.2).\n- Pollinations text also tried."
    console.log("[Project Deoxys] Chat provider: demo | reason:", reason)
    return NextResponse.json({ text: demo, provider: "demo", reason }, { status: 503 })
  } catch (err: any) {
    const message = err?.message || "Unknown error"
    console.log("[Project Deoxys] Chat route error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

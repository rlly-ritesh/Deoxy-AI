export type SpeakOptions = {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export async function getFemaleVoice(preferredLang?: string): Promise<SpeechSynthesisVoice | undefined> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined
  const synth = window.speechSynthesis

  const loadVoices = () =>
    new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const voices = synth.getVoices()
      if (voices.length) return resolve(voices)
      const handler = () => {
        resolve(synth.getVoices())
        synth.removeEventListener("voiceschanged", handler)
      }
      synth.addEventListener("voiceschanged", handler)
    })

  const voices = await loadVoices()
  const lang = (preferredLang || navigator.language || "en-US").toLowerCase()

  const femaleHints = [
    "Female",
    "Samantha",
    "Zira",
    "Amelia",
    "Jenny",
    "Aria",
    "Serena",
    "Natasha",
    "Google UK English Female",
  ]
  const byLang = (v: SpeechSynthesisVoice) => (v.lang || "").toLowerCase().startsWith(lang)

  return (
    voices.find((v) => byLang(v) && femaleHints.some((h) => v.name.includes(h))) ||
    voices.find((v) => femaleHints.some((h) => v.name.includes(h))) ||
    voices.find((v) => (v.lang || "").toLowerCase().startsWith("en")) ||
    voices[0]
  )
}

export async function speakText(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  const voice = await getFemaleVoice(opts.lang)
  if (voice) utter.voice = voice

  // Louder, slightly expressive defaults
  utter.rate = opts.rate ?? 0.98
  utter.pitch = opts.pitch ?? 1.12
  utter.volume = opts.volume ?? 1.0

  window.speechSynthesis.speak(utter)
}

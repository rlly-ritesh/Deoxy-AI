// Basic SpeechRecognition types for TS without lib.dom extras
export interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: any) => void) | null
  onend: ((event: any) => void) | null
  start: () => void
  stop: () => void
}

export interface SpeechRecognitionResult {
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition }
    webkitSpeechRecognition?: { new (): SpeechRecognition }
  }
}

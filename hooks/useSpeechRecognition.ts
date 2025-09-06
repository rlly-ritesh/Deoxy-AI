import { useEffect, useRef, useState } from "react";

type Options = { lang?: string; interimResults?: boolean; continuous?: boolean };

export default function useSpeechRecognition(opts: Options = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec = new SR();
    rec.lang = opts.lang ?? "en-US";
    rec.interimResults = opts.interimResults ?? true;
    rec.continuous = opts.continuous ?? false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      setTranscript(txt);
    };

    rec.onerror = (e: any) => {
      setError(e.error ?? "error");
      setListening(false);
    };

    recRef.current = rec;

    return () => {
      try { recRef.current?.stop(); } catch {}
      recRef.current = null;
    };
  }, []);

  const start = () => {
    setTranscript("");
    setError(null);
    try { recRef.current?.start(); } catch (err) { setError(String(err)); }
  };
  const stop = () => {
    try { recRef.current?.stop(); } catch {}
  };

  return { supported, listening, transcript, error, start, stop, setTranscript };
}

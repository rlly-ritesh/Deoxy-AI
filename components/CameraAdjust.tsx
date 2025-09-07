 "use client"

import React, { useEffect, useRef, useState } from "react"

export default function CameraAdjust() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectorRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [brightness, setBrightness] = useState<number>(1)
  const [autoMode, setAutoMode] = useState<boolean>(true)
  const [manualValue, setManualValue] = useState<number>(1)

  // Initialize CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--camera-brightness", `${brightness}`)
  }, [])

  // Update CSS variable whenever brightness changes
  useEffect(() => {
    if (autoMode) {
      document.documentElement.style.setProperty("--camera-brightness", `${brightness}`)
    }
  }, [brightness, autoMode])

  // Apply manual value
  useEffect(() => {
    if (!autoMode) {
      document.documentElement.style.setProperty("--camera-brightness", `${manualValue}`)
    }
  }, [manualValue, autoMode])

  useEffect(() => {
    const hasFace = !!((window as any).FaceDetector || (window as any).FaceDetector !== undefined)
    setSupported(hasFace)
  }, [])

  const startCamera = async () => {
    setError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported in this browser.")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.width = 160
        videoRef.current.height = 120
        await videoRef.current.play()
      }
      setStreaming(true)
      initDetectorAndLoop()
    } catch (e: any) {
      console.error("Camera error:", e)
      setError("Could not access camera. Check permissions.")
    }
  }

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setStreaming(false)
    if (autoMode) {
      setBrightness(1)
      document.documentElement.style.setProperty("--camera-brightness", `1`)
    }
  }

  const initDetectorAndLoop = async () => {
    const FaceDetectorCtor = (window as any).FaceDetector || (window as any).FaceDetector
    if (FaceDetectorCtor) {
      try {
        detectorRef.current = new (FaceDetectorCtor as any)({ fastMode: true, maxDetectedFaces: 1 })
        setSupported(true)
      } catch {
        detectorRef.current = null
        setSupported(false)
      }
    } else {
      detectorRef.current = null
      setSupported(false)
    }
    rafRef.current = requestAnimationFrame(processFrame)
  }

  const processFrame = async () => {
    try {
      const v = videoRef.current
      if (!v || v.readyState < 2) {
        rafRef.current = requestAnimationFrame(processFrame)
        return
      }

      // ==== Face detection / auto-brightness ====
      if (detectorRef.current && typeof detectorRef.current.detect === "function") {
        try {
          const faces = await detectorRef.current.detect(v)
          if (faces && faces.length > 0) {
            const f = faces[0]
            const vw = v.videoWidth || v.clientWidth || 1
            const vh = v.videoHeight || v.clientHeight || 1
            const areaRatio = (f.boundingBox?.width * f.boundingBox?.height) / (vw * vh)
            const minA = 0.02
            const maxA = 0.25
            let t = (areaRatio - minA) / (maxA - minA)
            t = Math.max(0, Math.min(1, t))
            const newBrightness = 1.15 - 0.3 * t
            if (autoMode) {
              setBrightness(newBrightness)
              document.documentElement.style.setProperty("--camera-brightness", `${newBrightness}`)
            }
          } else if (autoMode) {
            const newBrightness = brightness + (1 - brightness) * 0.04
            setBrightness(newBrightness)
            document.documentElement.style.setProperty("--camera-brightness", `${newBrightness}`)
          }
        } catch {
          await fallbackLuminanceAdjust(v)
        }
      } else {
        await fallbackLuminanceAdjust(v)
      }

      // ==== Backend capture ====
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = v.videoWidth
        canvas.height = v.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const rootStyle = getComputedStyle(document.documentElement)
          const brightnessVar = rootStyle.getPropertyValue("--camera-brightness") || 1
          const contrastVar = rootStyle.getPropertyValue("--camera-contrast") || 1
          const saturateVar = rootStyle.getPropertyValue("--camera-saturation") || 1

          ctx.filter = `brightness(${brightnessVar}) contrast(${contrastVar}) saturate(${saturateVar})`
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)

          canvas.toBlob((blob) => {
            if (blob) {
              fetch("/api/upload-frame", {
                method: "POST",
                body: blob,
              })
            }
          })
        }
      }

    } catch (err) {
      console.error("processFrame err:", err)
    } finally {
      rafRef.current = requestAnimationFrame(processFrame)
    }
  }

  const fallbackLuminanceAdjust = async (v: HTMLVideoElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cw = 160
    const ch = Math.round((v.videoHeight / v.videoWidth) * cw) || 120
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    try {
      ctx.drawImage(v, 0, 0, cw, ch)
      const data = ctx.getImageData(0, 0, cw, ch).data
      let total = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        total += 0.2126*r + 0.7152*g + 0.0722*b
      }
      const avg = total / (data.length/4)
      const newBrightness = 1.2 - (avg/255)*0.35
      if (autoMode) {
        setBrightness(newBrightness)
        document.documentElement.style.setProperty("--camera-brightness", `${newBrightness}`)
      }
    } catch (e) {}
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (streaming ? stopCamera() : startCamera())}
            className="rounded-md px-2 py-1 border text-sm"
            title="Start/stop camera for auto brightness"
          >
            {streaming ? "Stop Camera" : "Start Camera"}
          </button>

          <button
            onClick={() => {
              setAutoMode(!autoMode)
              if (!autoMode) document.documentElement.style.setProperty("--camera-brightness", `${brightness}`)
            }}
            className={`rounded-md px-2 py-1 border text-sm ${autoMode ? "bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]" : ""}`}
            title="Toggle auto brightness"
          >
            {autoMode ? "Auto" : "Manual"}
          </button>

          <div className="text-xs opacity-80 ml-1">
            Brightness: <strong>{(autoMode ? brightness : manualValue).toFixed(2)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.01}
            value={autoMode ? brightness : manualValue}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (autoMode) {
                setAutoMode(false)
                setManualValue(v)
              } else {
                setManualValue(v)
              }
            }}
            className="w-36"
            aria-label="brightness-slider"
          />
          <button
            className="rounded-md px-2 py-1 border text-sm"
            onClick={() => {
              setManualValue(1)
              setAutoMode(true)
              document.documentElement.style.setProperty("--camera-brightness", `1`)
            }}
            title="Reset brightness"
          >
            Reset
          </button>
        </div>

        {error && <div className="text-red-500 text-xs">{error}</div>}
        <div className="text-xs opacity-80">Detector: {supported === null ? "?" : supported ? "FaceDetector" : "Luminance fallback"}</div>
      </div>

      {/* Hidden video and canvas for backend capture */}
      <video ref={videoRef} playsInline muted className="hidden" width={160} height={120} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}

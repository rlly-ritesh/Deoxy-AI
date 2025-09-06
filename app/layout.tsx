import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Deoxy AI — Dyslexia‑Friendly ChatBot",
  description: "Dyslexia‑friendly AI tools",
  generator: "Deoxy AI",
  applicationName: "Deoxy AI",
  keywords: ["Dyslexia", "AI", "Chatbot", "Accessibility", "Education", "Learning"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* font-sans picks up --font-sans from globals.css, now mapped to OpenDyslexic */}
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}

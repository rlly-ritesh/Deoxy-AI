"use client"
import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("dfc:session")
    if (session) router.replace("/")
  }, [router])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError("Email and password are required.")
      return
    }
    localStorage.setItem("dfc:session", JSON.stringify({ email }))
    router.replace("/")
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 md:p-8">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-lg border p-6 space-y-4"
        style={{ backgroundColor: "var(--panel-bg)", borderColor: "var(--border-c)" }}
      >
        <h1 className="text-2xl font-bold">Log in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="w-full rounded-md border p-3"
            style={{ borderColor: "var(--border-c)" }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="w-full rounded-md border p-3"
            style={{ borderColor: "var(--border-c)" }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full rounded-md px-4 py-2 bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
          type="submit"
        >
          Log in
        </button>
        <p className="text-sm">
          No account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
        <p className="text-xs opacity-80">Note: This is demo-only and not secure.</p>
      </form>
    </main>
  )
}

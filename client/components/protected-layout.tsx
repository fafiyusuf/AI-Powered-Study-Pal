"use client"

import { useAppStore } from "@/store/useAppStore"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"
import { Navigation } from "./navigation"

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)
  const hydrate = useAppStore((state) => state.hydrateAuthFromStorage)
  const [hydrated, setHydrated] = useState(false)

  // Run auth hydration once on mount
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      await hydrate()
      if (!cancelled) {
        setHydrated(true)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [hydrate])

  // After hydration completes, decide whether to redirect
  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [hydrated, isLoggedIn, router])

  // While hydrating, or if we're about to redirect, don't render the app shell
  if (!hydrated || !isLoggedIn) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">{children}</main>
    </>
  )
}

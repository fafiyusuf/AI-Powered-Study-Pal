"use client"

import { useAppStore } from "@/store/useAppStore"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"
import { Navigation } from "./navigation"

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)
  const hydrate = useAppStore((state) => state.hydrateAuthFromStorage)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    hydrate()
    setIsMounted(true)
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router, hydrate])

  if (!isMounted || !isLoggedIn) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">{children}</main>
    </>
  )
}

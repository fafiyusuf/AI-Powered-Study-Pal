"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import { Navigation } from "./navigation"

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

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

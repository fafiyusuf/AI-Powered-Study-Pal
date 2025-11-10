"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppStore } from "@/store/useAppStore"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const isLoggedIn = useAppStore((state) => state.isLoggedIn)

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white mb-2">StudyAI</h1>
          <p className="text-slate-400 text-lg">Your personal AI study companion</p>
        </div>

        <p className="text-slate-300 text-base leading-relaxed">
          Master any subject with interactive notes, AI-powered flashcards, quizzes, and real-time AI tutoring.
        </p>

        <div className="flex flex-col gap-3 pt-6">
          <Link
            href="/login"
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-indigo-400 font-semibold">Notes</div>
            <div className="text-slate-400 text-xs">Organize learning</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-indigo-400 font-semibold">Flashcards</div>
            <div className="text-slate-400 text-xs">Quick review</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-indigo-400 font-semibold">AI Chat</div>
            <div className="text-slate-400 text-xs">24/7 tutor</div>
          </div>
        </div>
      </div>
    </div>
  )
}

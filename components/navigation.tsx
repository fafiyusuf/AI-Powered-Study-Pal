"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAppStore((state) => state.logout)
  const user = useAppStore((state) => state.user)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/notes", label: "Notes", icon: "📝" },
    { href: "/flashcards", label: "Flashcards", icon: "🎯" },
    { href: "/quiz", label: "Quiz", icon: "✅" },
    { href: "/ai-chat", label: "AI Chat", icon: "🤖" },
  ]

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-400">
              StudyAI
            </Link>
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">
              {user?.name && <span>Welcome, {user.name.split(" ")[0]}</span>}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

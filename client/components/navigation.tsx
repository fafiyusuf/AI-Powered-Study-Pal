"use client"

import { useAppStore } from "@/store/useAppStore";
import { CheckCircle, FileText, LayoutDashboard, LogOut, Sparkles, SquareStack, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// --- MAIN COMPONENT CODE ---
export default function App() {
    return <Navigation />;
}

export function Navigation() {
  // These use the mocked versions above
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAppStore()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/notes", label: "Notes", icon: FileText },
    { href: "/flashcards", label: "Flashcards", icon: SquareStack },
    { href: "/quiz", label: "Quiz", icon: CheckCircle },
    { href: "/ai-chat", label: "AI Chat", icon: Sparkles },
  ]

  return (
    <nav className="bg-slate-900 border-b border-indigo-700 shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Main Nav Items */}
          <div className="flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="text-2xl font-extrabold text-indigo-400 tracking-wide hover:text-indigo-300 transition-colors"
            >
              StudyAI
            </Link>
            
            <div className="hidden md:flex gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-indigo-700 text-white shadow-lg shadow-indigo-700/30"
                          : "text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            {user?.name && (
              <div className="flex items-center text-sm text-slate-300 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <User className="w-4 h-4 mr-2 text-indigo-400" />
                <span className="font-semibold">Welcome,</span>
                <span className="ml-1 text-white font-medium">{user.name.split(" ")[0]}</span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="
                flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl 
                text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-500/30
              "
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
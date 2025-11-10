"use client"

import { ProtectedLayout } from "@/components/protected-layout"
import { StatsCard } from "@/components/stats-card"
import { useAppStore } from "@/store/useAppStore"
import Link from "next/link"
import { useMemo } from "react"

export default function DashboardPage() {
  const notes = useAppStore((state) => state.notes)
  const flashcards = useAppStore((state) => state.flashcards)
  const quizzes = useAppStore((state) => state.quizzes)
  const quizResults = useAppStore((state) => state.quizResults)

  const stats = useMemo(() => {
    const averageScore =
      quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / quizResults.length)
        : 0

    return {
      totalNotes: notes.length,
      totalFlashcards: flashcards.length,
      totalQuizzes: quizzes.length,
      studyStreak: 7,
      averageScore,
    }
  }, [notes.length, flashcards.length, quizzes.length, quizResults])

  const recentNotes = notes.slice(-3).reverse()
  const recentFlashcards = flashcards.slice(-3).reverse()

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Track your learning progress and manage your study materials</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Notes" value={stats.totalNotes} icon="📝" color="indigo" />
          <StatsCard title="Flashcards" value={stats.totalFlashcards} icon="🎯" color="emerald" />
          <StatsCard title="Quizzes" value={stats.totalQuizzes} icon="✅" color="amber" />
          <StatsCard
            title="Study Streak"
            value={`${stats.studyStreak} days`}
            icon="🔥"
            color="blue"
            trend="Keep it up!"
          />
        </div>

        {/* Average Score */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Performance Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Average Quiz Score</span>
                <span className="text-white font-semibold">{stats.averageScore}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-3 rounded-full"
                  style={{ width: `${stats.averageScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recent Notes */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Notes</h2>
              <Link href="/notes" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentNotes.length > 0 ? (
                recentNotes.map((note) => (
                  <div key={note.id} className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/50 transition-colors">
                    <p className="text-white font-medium text-sm">{note.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{note.subject}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No notes yet. Create your first note!</p>
              )}
            </div>
          </div>

          {/* Recent Flashcards */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Flashcards</h2>
              <Link href="/flashcards" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentFlashcards.length > 0 ? (
                recentFlashcards.map((card) => (
                  <div key={card.id} className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/50 transition-colors">
                    <p className="text-white font-medium text-sm line-clamp-2">{card.front}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {card.subject} • {card.difficulty}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No flashcards yet. Create your first card!</p>
              )}
            </div>
          </div>
        </div>

        {/* Study Tips */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Study Tips</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-1">•</span>
              <span>Review flashcards regularly to reinforce memory using spaced repetition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-1">•</span>
              <span>Take quizzes to identify weak areas and track your progress</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-1">•</span>
              <span>Chat with AI anytime for explanations and help with difficult concepts</span>
            </li>
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  )
}

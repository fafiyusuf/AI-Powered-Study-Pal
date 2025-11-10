"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/protected-layout"
import { QuizPlayer } from "@/components/quiz-player"
import { useAppStore } from "@/store/useAppStore"

export default function QuizPage() {
  const quizzes = useAppStore((state) => state.quizzes)
  const quizResults = useAppStore((state) => state.quizResults)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId)

  if (activeQuiz) {
    return (
      <ProtectedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setActiveQuizId(null)}
            className="mb-6 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            ← Back to Quizzes
          </button>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white">{activeQuiz.title}</h1>
            <p className="text-slate-400">{activeQuiz.subject}</p>
          </div>
          <QuizPlayer quiz={activeQuiz} onComplete={() => setActiveQuizId(null)} />
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quizzes</h1>
          <p className="text-slate-400">Test your knowledge with interactive quizzes</p>
        </div>

        {/* Quiz List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const quizResult = quizResults.find((r) => r.quizId === quiz.id)
            const lastAttempt = quizResults
              .filter((r) => r.quizId === quiz.id)
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]

            return (
              <div
                key={quiz.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-colors"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                  <p className="text-sm text-indigo-400 mb-3">{quiz.subject}</p>
                  <p className="text-sm text-slate-400 mb-4">{quiz.questions.length} questions</p>

                  {lastAttempt && (
                    <div className="bg-slate-700/30 rounded p-3 mb-4">
                      <p className="text-xs text-slate-400 mb-1">Last attempt</p>
                      <p className="text-lg font-semibold text-indigo-400">
                        {Math.round((lastAttempt.score / lastAttempt.totalQuestions) * 100)}%
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveQuizId(quiz.id)}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {quizResult ? "Retake Quiz" : "Start Quiz"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No quizzes available yet.</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}

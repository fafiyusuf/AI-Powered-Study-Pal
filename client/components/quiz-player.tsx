"use client"

import { useState } from "react"
import type { Quiz, QuizResult } from "@/types/index"
import { useAppStore } from "@/store/useAppStore"

interface QuizPlayerProps {
  quiz: Quiz
  onComplete: () => void
}

export function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const addQuizResult = useAppStore((state) => state.addQuizResult)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)

  const question = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate score
      const score = answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length

      const result: QuizResult = {
        quizId: quiz.id,
        score,
        totalQuestions: quiz.questions.length,
        completedAt: new Date(),
        answers,
      }

      addQuizResult(result)
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  if (showResults) {
    const score = answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length
    const percentage = Math.round((score / quiz.questions.length) * 100)

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
          <div className="mb-6">
            <p className="text-5xl font-bold text-indigo-400 mb-2">{percentage}%</p>
            <p className="text-slate-300 text-lg">
              You got {score} out of {quiz.questions.length} questions correct
            </p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 mb-6 space-y-3">
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="text-left">
                <p className="text-sm text-slate-300 mb-1">
                  <span className="font-semibold">Q{index + 1}:</span> {q.question}
                </p>
                <div className="flex gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      answers[index] === q.correctAnswer
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    Your answer: {q.options[answers[index]]}
                  </span>
                </div>
                {answers[index] !== q.correctAnswer && (
                  <p className="text-xs text-emerald-400 mt-1">Correct: {q.options[q.correctAnswer]}</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={onComplete}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm font-medium text-slate-300">
              {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  answers[currentQuestion] === index
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-100"
                    : "bg-slate-700/30 border-slate-600 text-slate-300 hover:border-indigo-500/50"
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={answers[currentQuestion] === undefined}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isLastQuestion ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

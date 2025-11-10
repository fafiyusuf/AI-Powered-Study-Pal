export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Note {
  id: string
  title: string
  content: string
  subject: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  createdAt: Date
  userId: string
  difficulty: "easy" | "medium" | "hard"
}

export interface Quiz {
  id: string
  title: string
  subject: string
  questions: QuizQuestion[]
  createdAt: Date
  userId: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  completedAt: Date
  answers: number[]
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  // Optional classifier for assistant messages
  // When set to "summary", UI can show relevant actions (e.g., Add to Notes)
  kind?: "text" | "summary"
}

export interface StudySession {
  date: Date
  duration: number
  subject: string
}

export interface DashboardStats {
  totalNotes: number
  totalFlashcards: number
  totalQuizzes: number
  studyStreak: number
  averageScore: number
  recentSessions: StudySession[]
}

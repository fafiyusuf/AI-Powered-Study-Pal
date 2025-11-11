import type { ChatMessage, Flashcard, Note, Quiz, QuizResult, User } from "@/types/index"

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
}

export interface StudyState {
  notes: Note[]
  flashcards: Flashcard[]
  quizzes: Quiz[]
  chatHistory: ChatMessage[]
  quizResults: QuizResult[]
}

export interface AppState extends AuthState, StudyState {
  // Auth actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  hydrateAuthFromStorage: () => Promise<void>

  // Note actions
  addNote: (note: Note) => void
  updateNote: (id: string, note: Partial<Note>) => void
  deleteNote: (id: string) => void
  getNotesBySubject: (subject: string) => Note[]
  loadNotes: () => Promise<void> // <-- add this

  // Flashcard actions
  addFlashcard: (flashcard: Flashcard) => void
  updateFlashcard: (id: string, flashcard: Partial<Flashcard>) => void
  deleteFlashcard: (id: string) => void
  getFlashcardsBySubject: (subject: string) => Flashcard[]
  loadFlashcards: () => Promise<void>
  createFlashcardRemote: (front: string, back: string, subject: string, difficulty: Flashcard['difficulty']) => Promise<void>
  deleteFlashcardRemote: (id: string) => Promise<void>

  // Quiz actions
  addQuiz: (quiz: Quiz) => void
  getQuizzes: () => Quiz[]
  addQuizResult: (result: QuizResult) => void
  getQuizResults: () => QuizResult[]

  // Chat actions
  addChatMessage: (message: ChatMessage) => void
  getChatHistory: () => ChatMessage[]
  clearChatHistory: () => void

  // Utility
  getStudyStats: () => any
}

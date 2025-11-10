import { create } from "zustand"
import type { AppState } from "./types"
import type { User, Note, Flashcard, Quiz, ChatMessage, QuizResult } from "@/types/index"
import { mockUsers, mockNotes, mockFlashcards, mockQuizzes } from "@/mockData/index"

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useAppStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  isLoggedIn: false,
  isLoading: false,

  // Study state
  notes: mockNotes,
  flashcards: mockFlashcards,
  quizzes: mockQuizzes,
  chatHistory: [],
  quizResults: [],

  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = mockUsers.find((u) => u.email === email)
    if (user) {
      set({ user, isLoggedIn: true, isLoading: false })
      localStorage.setItem("auth_token", `mock_token_${user.id}`)
    } else {
      set({ isLoading: false })
      throw new Error("Invalid credentials")
    }
  },

  signup: async (email: string, name: string, password: string) => {
    set({ isLoading: true })
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newUser: User = {
      id: generateId(),
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    }

    set({ user: newUser, isLoggedIn: true, isLoading: false })
    localStorage.setItem("auth_token", `mock_token_${newUser.id}`)
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, chatHistory: [] })
    localStorage.removeItem("auth_token")
  },

  // Note actions
  addNote: (note: Note) => {
    set((state) => ({
      notes: [...state.notes, note],
    }))
  },

  updateNote: (id: string, updates: Partial<Note>) => {
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note)),
    }))
  },

  deleteNote: (id: string) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }))
  },

  getNotesBySubject: (subject: string) => {
    return get().notes.filter((note) => note.subject.toLowerCase() === subject.toLowerCase())
  },

  // Flashcard actions
  addFlashcard: (flashcard: Flashcard) => {
    set((state) => ({
      flashcards: [...state.flashcards, flashcard],
    }))
  },

  updateFlashcard: (id: string, updates: Partial<Flashcard>) => {
    set((state) => ({
      flashcards: state.flashcards.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)),
    }))
  },

  deleteFlashcard: (id: string) => {
    set((state) => ({
      flashcards: state.flashcards.filter((fc) => fc.id !== id),
    }))
  },

  getFlashcardsBySubject: (subject: string) => {
    return get().flashcards.filter((fc) => fc.subject.toLowerCase() === subject.toLowerCase())
  },

  // Quiz actions
  addQuiz: (quiz: Quiz) => {
    set((state) => ({
      quizzes: [...state.quizzes, quiz],
    }))
  },

  getQuizzes: () => get().quizzes,

  addQuizResult: (result: QuizResult) => {
    set((state) => ({
      quizResults: [...state.quizResults, result],
    }))
  },

  getQuizResults: () => get().quizResults,

  // Chat actions
  addChatMessage: (message: ChatMessage) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, message],
    }))
  },

  getChatHistory: () => get().chatHistory,

  clearChatHistory: () => {
    set({ chatHistory: [] })
  },

  // Utility
  getStudyStats: () => {
    const state = get()
    const results = state.quizResults
    const averageScore =
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
        : 0

    return {
      totalNotes: state.notes.length,
      totalFlashcards: state.flashcards.length,
      totalQuizzes: state.quizzes.length,
      studyStreak: 7,
      averageScore,
      recentSessions: [],
    }
  },
}))

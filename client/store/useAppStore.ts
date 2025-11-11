import { mockNotes, mockQuizzes } from "@/mockData/index"
import type { ChatMessage, Flashcard, Note, Quiz, QuizResult, User } from "@/types/index"
import { create } from "zustand"
import type { AppState } from "./types"

// API helper
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "")

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    if (res.status === 401 && typeof window !== 'undefined') {
      // drop invalid token to avoid repeated 401s
      localStorage.removeItem('auth_token')
    }
    try { const j = await res.json(); message = j.message || message } catch {}
    throw new Error(message)
  }
  try { return await res.json() as T } catch { return {} as T }
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useAppStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  isLoggedIn: false,
  isLoading: false,

  // Study state
  notes: mockNotes,
  flashcards: [],
  quizzes: mockQuizzes,
  chatHistory: [],
  quizResults: [],

  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await api<{ success: boolean; data: { user: any; token: string } }>(`/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      const payload = data.data
      const user: User = {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        avatar: payload.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.user.name}`
      }
      localStorage.setItem('auth_token', payload.token)
      set({ user, isLoggedIn: true, isLoading: false })
    } catch (e: any) {
      set({ isLoading: false })
      throw new Error(e.message || 'Login failed')
    }
  },

  signup: async (email: string, name: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await api<{ success: boolean; user: any; token?: string }>(`/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, name, password })
      })
      // Controller returns { success, message, user }, but service returns { user, token }.
      // So token is actually under data.user.token and actual user at data.user.user
      const wrapper = (data as any).user || {}
      const actualUser = wrapper.user || (data as any).user || {}
      const token = (data as any).token || wrapper.token
      const user: User = {
        id: actualUser.id,
        email: actualUser.email || email,
        name: actualUser.name || name,
        avatar: actualUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${actualUser.name || name}`,
      }
      if (token) localStorage.setItem('auth_token', token)
      set({ user, isLoggedIn: true, isLoading: false })
    } catch (e: any) {
      set({ isLoading: false })
      throw new Error(e.message || 'Signup failed')
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, chatHistory: [] })
    localStorage.removeItem("auth_token")
  },
  hydrateAuthFromStorage: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token && !get().isLoggedIn) {
      set({ isLoggedIn: true })
    }
  },

 // --- Note actions ---
addNote: async (noteData: { title: string; content: string; subject: string }) => {
  try {
    const res = await api<{ success: boolean; data: Note }>("/api/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    })
    set((state) => ({
      notes: [res.data, ...state.notes],
    }))
  } catch (err) {
    console.error("Failed to add note:", err)
  }
},

updateNote: async (id: string, updates: Partial<Note>) => {
  try {
    const res = await api<{ success: boolean; data: Note }>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? res.data : note)),
    }))
  } catch (err) {
    console.error("Failed to update note:", err)
  }
},

deleteNote: async (id: string) => {
  const prevNotes = get().notes
  set({ notes: prevNotes.filter((note) => note.id !== id) })
  try {
    await api(`/api/notes/${id}`, { method: "DELETE" })
  } catch (err) {
    console.error("Failed to delete note:", err)
    set({ notes: prevNotes })
  }
},

getNotesBySubject: (subject: string) => {
  return get().notes.filter(
    (note) => note.subject.toLowerCase() === subject.toLowerCase()
  )
},

loadNotes: async () => {
  try {
    const res = await api<{ success: boolean; data: Note[] }>("/api/notes")
    set({ notes: res.data })
  } catch (err) {
    console.error("Failed to load notes:", err)
  }
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

  // Remote flashcards
  loadFlashcards: async () => {
    try {
      const res = await api<{ success: boolean; data: any[] }>(`/api/flashcards`)
      const cards: Flashcard[] = (res.data || []).map((fc: any) => ({
        id: fc.id,
        front: fc.question,
        back: fc.answer,
        subject: (fc.tags && fc.tags[0]) || 'General',
        difficulty: 'easy',
        createdAt: new Date(fc.createdAt),
        userId: fc.userId,
      }))
      set({ flashcards: cards })
    } catch (e) {
      console.warn('Failed to load flashcards', e)
    }
  },

  createFlashcardRemote: async (front: string, back: string, subject: string, difficulty: Flashcard['difficulty']) => {
    const optimistic: Flashcard = {
      id: `temp_${Date.now()}`,
      front,
      back,
      subject,
      difficulty,
      createdAt: new Date(),
      userId: get().user?.id || 'unknown',
    }
    set((state) => ({ flashcards: [optimistic, ...state.flashcards] }))
    try {
      const res = await api<{ success: boolean; data: any }>(`/api/flashcards`, {
        method: 'POST',
        body: JSON.stringify({ question: front, answer: back, tags: [subject] })
      })
      const saved = res.data
      set((state) => ({
        flashcards: state.flashcards.map((c) =>
          c.id === optimistic.id
            ? {
                id: saved.id,
                front: saved.question,
                back: saved.answer,
                subject: (saved.tags && saved.tags[0]) || subject,
                difficulty,
                createdAt: new Date(saved.createdAt),
                userId: saved.userId,
              }
            : c
        ),
      }))
    } catch (e) {
      // rollback
      set((state) => ({ flashcards: state.flashcards.filter((c) => c.id !== optimistic.id) }))
      throw e
    }
  },

  deleteFlashcardRemote: async (id: string) => {
    const snapshot = get().flashcards
    set({ flashcards: snapshot.filter((c) => c.id !== id) })
    try {
      await api(`/api/flashcards/${id}`, { method: 'DELETE' })
    } catch (e) {
      set({ flashcards: snapshot })
      throw e
    }
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

// Dashboard relies on real backend-loaded data. Quizzes default empty until API is implemented.
import type { ChatMessage, Flashcard, Note, Quiz, QuizQuestion, QuizResult, User } from "@/types/index"
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
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('API error', {
        url: `${API_BASE}${path}`,
        method: options.method || 'GET',
        status: res.status,
      })
    }
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
  notes: [],
  flashcards: [],
  quizzes: [],
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
    const res = await api<{ success: boolean; data: any }>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: noteData.title, content: noteData.content, tags: [noteData.subject] }),
    })
    const n = res.data
    const mapped: Note = {
      id: n.id,
      title: n.title,
      content: n.content,
      subject: (n.tags && n.tags[0]) || noteData.subject || 'General',
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
      userId: n.userId,
    }
    set((state) => ({
      notes: [mapped, ...state.notes],
    }))
  } catch (err) {
    console.error("Failed to add note:", err)
  }
},

updateNote: async (id: string, updates: Partial<Note>) => {
  try {
    const payload: any = { ...updates }
    if (typeof updates.subject === 'string') {
      payload.tags = [updates.subject]
      delete payload.subject
    }
    const res = await api<{ success: boolean; data: any }>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    const n = res.data
    const mapped: Note = {
      id: n.id,
      title: n.title,
      content: n.content,
      subject: (n.tags && n.tags[0]) || updates.subject || 'General',
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
      userId: n.userId,
    }
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? mapped : note)),
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
      // API returns dates as strings; convert to Date objects for consistency
      const notes = (res.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        subject: (n.tags && n.tags[0]) || 'General',
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
        userId: n.userId,
      }))
      set({ notes })
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
    set((state) => ({ quizzes: [...state.quizzes, quiz] }))
  },

  getQuizzes: () => get().quizzes,

  // Remote quizzes
  loadQuizzes: async () => {
    try {
      const res = await api<{ success: boolean; data: any[] }>(`/api/quizzes`)
      const mapped: Quiz[] = (res.data || []).map((q: any) => {
        const questionCount = q._count?.questions || 0
        const placeholderQuestions: QuizQuestion[] = Array.from({ length: questionCount }).map((_, i) => ({
          id: `${q.id}-q${i}`,
          question: `Question ${i + 1}`,
          options: [],
          correctAnswer: 0,
          explanation: "",
        }))
        return {
          id: q.id,
          title: q.title,
          subject: (q.description?.toString().match(/Generated from (.*)/)?.[1] || 'General'),
          questions: placeholderQuestions,
          createdAt: new Date(q.createdAt),
          userId: q.userId,
        }
      })
      set({ quizzes: mapped })
    } catch (e) {
      console.warn('Failed to load quizzes', e)
    }
  },

  fetchQuizById: async (id: string) => {
    const res = await api<{ success: boolean; data: any }>(`/api/quizzes/${id}`)
    const q = res.data
    const toOptions = (answer: string): { options: string[]; correct: number } => {
      const correct = answer?.toString() || 'Correct answer'
      const options = [
        correct,
        'Not enough information',
        'A different concept',
        'None of the above',
      ]
      return { options, correct: 0 }
    }
    const questions: QuizQuestion[] = (q.questions || []).map((qq: any, idx: number) => {
      const mc = toOptions(qq.answer)
      return {
        id: qq.id || `${q.id}-q${idx}`,
        question: qq.question,
        options: mc.options,
        correctAnswer: mc.correct,
        explanation: qq.answer,
      }
    })
    const quiz: Quiz = {
      id: q.id,
      title: q.title,
      subject: (q.description?.toString().match(/Generated from (.*)/)?.[1] || 'General'),
      questions,
      createdAt: new Date(q.createdAt),
      userId: q.userId,
    }
    return quiz
  },

  createQuizRemote: async (payload: { title: string; description?: string; questions?: { question: string; answer: string }[] }) => {
    const res = await api<{ success: boolean; data: any }>(`/api/quizzes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const q = res.data
    // reflect in list by reloading summaries
    await get().loadQuizzes()
    return q.id as string
  },

  updateQuizRemote: async (id: string, payload: { title?: string; description?: string; questions?: { question: string; answer: string }[] }) => {
    await api<{ success: boolean; data: any }>(`/api/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    await get().loadQuizzes()
  },

  deleteQuizRemote: async (id: string) => {
    await api(`/api/quizzes/${id}`, { method: 'DELETE' })
    set((state) => ({ quizzes: state.quizzes.filter((q) => q.id !== id) }))
  },

  generateQuizRemote: async (payload: { sourceText: string; title?: string; subject?: string; count?: number }) => {
    const res = await api<{ success: boolean; data: any }>(`/api/quizzes/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await get().loadQuizzes()
    return res.data?.id as string
  },

  createQuizAttemptRemote: async (id: string, data: { answers: number[]; score: number }) => {
    await api<{ success: boolean; data: any }>(`/api/quizzes/${id}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers: data.answers, score: data.score }),
    })
  },

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

    // Compute streak: consecutive days (backwards) with at least one note or flashcard
    const activityDates = new Set<string>([
      ...state.notes.map((n) => new Date(n.createdAt).toDateString()),
      ...state.flashcards.map((f) => new Date(f.createdAt).toDateString()),
    ])
    let streak = 0
    for (let i = 0; i < 30; i++) { // look back up to 30 days
      const day = new Date()
      day.setDate(day.getDate() - i)
      if (activityDates.has(day.toDateString())) streak++
      else break
    }

    return {
      totalNotes: state.notes.length,
      totalFlashcards: state.flashcards.length,
      totalQuizzes: state.quizzes.length,
      studyStreak: streak,
      averageScore,
      recentSessions: [],
    }
  },
}))

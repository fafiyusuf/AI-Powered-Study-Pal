// --- API Helpers ---
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
function buildHeaders(init?: Record<string, string>): Headers {
  const h = new Headers(init)
  const t = getToken()
  if (t) h.set('Authorization', `Bearer ${t}`)
  return h
}

// Client-side PDF summarization stub (frontend only)
// Attempts to call backend /api/ai/summarize; if unavailable, returns a fallback summary.
// Determine API base: prefer NEXT_PUBLIC_API_BASE_URL; otherwise default to server port 5000 in dev.
const API_BASE = (() => {
  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")
  if (envBase) return envBase
  // Fallback heuristics for local dev: assume server on port 5000
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    const proto = protocol || 'http:'
    return `${proto}//${hostname}:5000`
  }
  return 'http://localhost:5000'
})()

function joinUrl(base: string, path: string) {
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function summarizePdf(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const url = joinUrl(API_BASE, "/api/ai/summarize")
    const res = await fetch(url, { method: "POST", body: formData, headers: buildHeaders() })
    if (!res.ok) {
      // Attempt to extract error message from backend
      let backendMsg = `Backend responded ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson?.message) backendMsg = errJson.message
      } catch {}
      // Special handling for auth failures
      if (res.status === 401) {
        return `Authentication required to summarize PDFs. Please sign in first. (Server: ${backendMsg})`
      }
      // For other errors, return a helpful message instead of falling back
      return `Summarization failed: ${backendMsg}`
    }
    // Expecting JSON: { success?: boolean; summary?: string }
    const data = await res.json().catch(() => ({})) as { summary?: string; success?: boolean }
    if (!data.summary) return "(Server succeeded but provided no summary text.)"
    return data.summary
  } catch (err) {
    console.warn("Summarize API failed or not ready, using fallback.", err)
    return await fallbackSummarize(file)
  }
}

async function fallbackSummarize(file: File): Promise<string> {
  // Lightweight heuristic: we cannot parse PDF robustly without pdf-parse/pdfjs on client.
  // We just read first bytes to create a placeholder message.
  const sizeKB = (file.size / 1024).toFixed(1)
  let headSample = ""
  try {
    const buf = await file.arrayBuffer()
    const slice = new Uint8Array(buf).subarray(0, 64)
    headSample = Array.from(slice)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("")
  } catch (e) {
    headSample = "(Could not read sample)"
  }

  return [
    `PDF '${file.name}' uploaded (${sizeKB} KB).`,
    `Real summarization unavailable.`,
    `If you're not logged in: sign in for full AI features.`,
    `If backend is running: ensure /api/ai/summarize is reachable and GENAI_API_KEY/GEMINI_API_KEY are set.`,
    `Fallback head sample:`,
    headSample || '(empty)'
  ].join('\n')
}

// --- AI Generation Stubs ---

export interface GeneratedFlashcardInput {
  sourceText: string
  subject?: string
  count?: number
  difficultyMix?: { easy?: number; medium?: number; hard?: number }
}

export interface GeneratedFlashcard {
  front: string
  back: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function generateFlashcardsFromText(input: GeneratedFlashcardInput): Promise<GeneratedFlashcard[]> {
  try {
    const res = await fetch(joinUrl(API_BASE, '/api/ai/generate-flashcards'), {
      method: 'POST',
  headers: buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Backend responded ${res.status}`)
    const data = await res.json().catch(() => ({})) as { flashcards?: GeneratedFlashcard[] }
    if (data.flashcards && data.flashcards.length) return data.flashcards
    return fallbackFlashcards(input)
  } catch (e) {
    console.warn('Flashcard generation backend unavailable, using fallback.', e)
    return fallbackFlashcards(input)
  }
}

function fallbackFlashcards(input: GeneratedFlashcardInput): GeneratedFlashcard[] {
  const subject = input.subject || 'General'
  const count = input.count && input.count > 0 ? Math.min(input.count, 10) : 5
  const base = input.sourceText.slice(0, 120) || 'Concept'
  const templates = [
    {
      front: `Summarize: ${base}?`,
      back: 'A concise explanation of the concept focusing on its primary purpose and usage.',
      difficulty: 'easy' as const,
    },
    {
      front: `Key terms in: ${subject}?`,
      back: 'List the most important terms and their brief definitions related to the topic.',
      difficulty: 'medium' as const,
    },
    {
      front: `Deep implication of the concept?`,
      back: 'An advanced insight describing why the concept matters in broader contexts.',
      difficulty: 'hard' as const,
    },
  ]
  const cards: GeneratedFlashcard[] = []
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length]
    cards.push({ front: tpl.front, back: tpl.back, subject, difficulty: tpl.difficulty })
  }
  return cards
}

export interface GeneratedNoteInput {
  sourceText: string
  subject?: string
  style?: 'concise' | 'detailed' | 'outline'
}

export interface GeneratedNoteResult {
  title: string
  content: string
  subject: string
}

export async function generateStudyNotesFromText(input: GeneratedNoteInput): Promise<GeneratedNoteResult> {
  try {
    const res = await fetch(joinUrl(API_BASE, '/api/ai/generate-notes'), {
      method: 'POST',
  headers: buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Backend responded ${res.status}`)
    const data = await res.json().catch(() => ({})) as { note?: GeneratedNoteResult }
    if (data.note) return data.note
    return fallbackNote(input)
  } catch (e) {
    console.warn('Note generation backend unavailable, using fallback.', e)
    return fallbackNote(input)
  }
}

// --- Chat ---
export async function sendChat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const res = await fetch(joinUrl(API_BASE, '/api/ai/chat'), {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error(`Chat failed ${res.status}`)
  const data = await res.json().catch(() => ({})) as { data?: { reply?: string } }
  return data?.data?.reply || ''
}

export async function explainFromText(sourceText: string, question?: string): Promise<string> {
  const res = await fetch(joinUrl(API_BASE, '/api/ai/explain'), {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sourceText, question }),
  })
  if (!res.ok) throw new Error(`Explain failed ${res.status}`)
  const data = await res.json().catch(() => ({})) as { explanation?: string }
  return data.explanation || ''
}

// Generate quiz questions via backend AI
export async function generateQuizFromText(input: { sourceText: string; subject?: string; count?: number; title?: string }): Promise<{ id?: string; questions?: { question: string; answer: string }[] }> {
  try {
    const res = await fetch(joinUrl(API_BASE, '/api/ai/generate-quiz'), {
      method: 'POST',
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Quiz generation failed ${res.status}`)
    const data = await res.json().catch(() => ({})) as { quiz?: { id?: string; questions?: { question: string; answer: string }[] } }
    if (data.quiz) return data.quiz
    return { questions: [] }
  } catch (e) {
    console.warn('Quiz generation API unavailable, returning empty quiz.', e)
    return { questions: [] }
  }
}

function fallbackNote(input: GeneratedNoteInput): GeneratedNoteResult {
  const subject = input.subject || 'AI Generated'
  const style = input.style || 'outline'
  const slice = input.sourceText.trim().split(/\s+/).slice(0, 60).join(' ')
  const title = slice.slice(0, 50) || 'Generated Study Notes'
  const content = `Style: ${style}\nSubject: ${subject}\n\nSource excerpt:\n${slice}\n\n(Replace with backend LLM generated content once available.)`
  return { title, content, subject }
}

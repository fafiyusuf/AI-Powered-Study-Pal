// Mock AI responses for demonstration
const mockResponses = [
  'To understand React hooks better, think of them as functions that let you "hook into" React features. useState is the most common one for managing component state.',
  "TypeScript interfaces define the structure of objects. They ensure type safety and help prevent bugs by catching type mismatches at compile time rather than runtime.",
  "The Event Loop in JavaScript handles asynchronous operations by managing the call stack, callback queue, and microtask queue. It processes callbacks in the correct order.",
  "Spaced repetition is a technique where you review material at increasing intervals. This helps move information from short-term to long-term memory more effectively.",
  "For exam preparation, create a study schedule that breaks topics into manageable chunks. Review previous topics regularly while learning new material.",
  "Flashcards are effective for memorization because they encourage active recall, forcing your brain to retrieve information rather than passively reading it.",
]

export async function generateMockAIResponse(userMessage: string): Promise<string> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

  // Simple keyword matching for relevant responses
  const keywords = userMessage.toLowerCase()

  if (keywords.includes("hook") || keywords.includes("usestate")) {
    return mockResponses[0]
  } else if (keywords.includes("interface") || keywords.includes("typescript")) {
    return mockResponses[1]
  } else if (keywords.includes("event") || keywords.includes("async")) {
    return mockResponses[2]
  } else if (keywords.includes("spaced") || keywords.includes("repeat")) {
    return mockResponses[3]
  } else if (keywords.includes("study") || keywords.includes("exam")) {
    return mockResponses[4]
  } else if (keywords.includes("flashcard") || keywords.includes("memorization")) {
    return mockResponses[5]
  }

  // Default response
  return "That's a great question! Based on your studies, I'd recommend focusing on understanding the core concepts first. Would you like me to explain any specific topics in more detail?"
}

// Client-side PDF summarization stub (frontend only)
// Attempts to call backend /api/summarize; if unavailable, returns a fallback summary.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

function joinUrl(base: string, path: string) {
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function summarizePdf(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const url = joinUrl(API_BASE, "/api/summarize")
    const res = await fetch(url, { method: "POST", body: formData })
    if (!res.ok) throw new Error(`Backend responded ${res.status}`)
    // Expecting JSON: { summary: string }
    const data = await res.json().catch(() => ({})) as { summary?: string }
    return data.summary || "(No summary returned from backend.)"
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

  return (
    `PDF '${file.name}' uploaded (${sizeKB} KB). Backend summarization endpoint not available yet. ` +
    `Replace this fallback once /api/summarize is implemented. File head sample: \n` + headSample
  )
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

function fallbackNote(input: GeneratedNoteInput): GeneratedNoteResult {
  const subject = input.subject || 'AI Generated'
  const style = input.style || 'outline'
  const slice = input.sourceText.trim().split(/\s+/).slice(0, 60).join(' ')
  const title = slice.slice(0, 50) || 'Generated Study Notes'
  const content = `Style: ${style}\nSubject: ${subject}\n\nSource excerpt:\n${slice}\n\n(Replace with backend LLM generated content once available.)`
  return { title, content, subject }
}

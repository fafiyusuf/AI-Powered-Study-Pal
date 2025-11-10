import type { ChatMessage as ChatMessageType } from "@/types/index"

interface ChatMessageProps {
  message: ChatMessageType
  onAddToNotes?: (content: string) => void
  onGenerateFlashcards?: (content: string) => void
  onGenerateNotes?: (content: string) => void
  generatingFlashcards?: boolean
  generatingNotes?: boolean
}

export function ChatMessage({ message, onAddToNotes, onGenerateFlashcards, onGenerateNotes, generatingFlashcards, generatingNotes }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-700 text-slate-100 rounded-bl-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-between gap-3 mt-1">
          <p className={`text-xs ${isUser ? "text-indigo-200" : "text-slate-400"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {!isUser && message.kind === "summary" && (
            <div className="flex gap-2">
              {onAddToNotes && (
                <button
                  onClick={() => onAddToNotes(message.content)}
                  className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                >
                  Add to Notes
                </button>
              )}
              {onGenerateFlashcards && (
                <button
                  onClick={() => onGenerateFlashcards(message.content)}
                  disabled={generatingFlashcards}
                  className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md"
                >
                  {generatingFlashcards ? 'Generating…' : 'Flashcards'}
                </button>
              )}
              {onGenerateNotes && (
                <button
                  onClick={() => onGenerateNotes(message.content)}
                  disabled={generatingNotes}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-md"
                >
                  {generatingNotes ? 'Refining…' : 'Refine Notes'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

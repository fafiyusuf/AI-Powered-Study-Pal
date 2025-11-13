import type { ChatMessage as ChatMessageType } from "@/types/index"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessageProps {
  message: ChatMessageType
  onAddToNotes?: (content: string) => void
  onGenerateFlashcards?: (content: string) => void
  onGenerateNotes?: (content: string) => void
  onGenerateQuiz?: (content: string) => void
  generatingFlashcards?: boolean
  generatingNotes?: boolean
  generatingQuiz?: boolean
}

export function ChatMessage({ message, onAddToNotes, onGenerateFlashcards, onGenerateNotes, onGenerateQuiz, generatingFlashcards, generatingNotes, generatingQuiz }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-fit max-w-[85%] md:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser ? "bg-indigo-600 text-white rounded-br-md" : "bg-slate-700 text-slate-100 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
              ul: (props) => <ul className="list-disc ml-5 my-2 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal ml-5 my-2 space-y-1" {...props} />,
              li: (props) => <li className="leading-snug" {...props} />,
              h1: (props) => <h1 className="text-base font-bold mt-2 mb-1" {...props} />,
              h2: (props) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
              h3: (props) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
              code: ((props: any) => {
                const { inline, ...rest } = props as any
                return inline ? (
                  <code className="bg-slate-800/60 px-1 py-0.5 rounded" {...rest} />
                ) : (
                  <code className="block bg-slate-800/60 p-2 rounded overflow-x-auto" {...rest} />
                )
              }) as any,
              blockquote: (props) => (
                <blockquote className="border-l-2 border-slate-500 pl-3 my-2 text-slate-300" {...props} />
              ),
              a: (props) => <a className="text-indigo-300 underline" target="_blank" rel="noreferrer" {...props} />,
              hr: () => <hr className="border-slate-600 my-2" />,
              table: (props) => (
                <div className="overflow-x-auto">
                  <table className="text-sm my-2" {...props} />
                </div>
              ),
              th: (props) => <th className="border border-slate-600 px-2 py-1 bg-slate-700" {...props} />,
              td: (props) => <td className="border border-slate-600 px-2 py-1" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
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
              {onGenerateQuiz && (
                <button
                  onClick={() => onGenerateQuiz(message.content)}
                  disabled={generatingQuiz}
                  className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-md"
                >
                  {generatingQuiz ? 'Generating…' : 'Quiz'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

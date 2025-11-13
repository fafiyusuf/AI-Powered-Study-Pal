"use client"

import type { Note } from "@/types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Modal } from "./modal"

interface NotePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
}

export function NotePreviewModal({ isOpen, onClose, note }: NotePreviewModalProps) {
  if (!note) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note.title} maxWidthClass="max-w-3xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-slate-700 text-indigo-300 border border-slate-600 text-[11px]">
              {note.subject}
            </span>
          </span>
          <span>{new Date(note.updatedAt).toLocaleString()}</span>
        </div>
  <div className="text-slate-200 text-sm leading-relaxed wrap-break-word">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => <p className="mb-3" {...props} />,
              h1: (props) => <h1 className="text-white text-xl mt-4 mb-2" {...props} />,
              h2: (props) => <h2 className="text-white text-lg mt-4 mb-2" {...props} />,
              h3: (props) => <h3 className="text-white text-base mt-3 mb-2" {...props} />,
              ul: (props) => <ul className="list-disc ml-6 my-2 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal ml-6 my-2 space-y-1" {...props} />,
              li: (props) => <li className="leading-snug" {...props} />,
              code: ((props: any) => {
                const { inline, ...rest } = props as any
                return inline ? (
                  <code className="bg-slate-800/60 px-1 py-0.5 rounded" {...rest} />
                ) : (
                  <code className="block bg-slate-800/60 p-2 rounded overflow-x-auto" {...rest} />
                )
              }) as any,
              a: (props) => <a className="text-indigo-300 underline" target="_blank" rel="noreferrer" {...props} />,
              hr: () => <hr className="border-slate-700 my-3" />,
              blockquote: (props) => (
                <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-slate-300" {...props} />
              ),
              table: (props) => (
                <div className="overflow-x-auto">
                  <table className="text-sm my-2" {...props} />
                </div>
              ),
              th: (props) => <th className="border border-slate-600 px-2 py-1 bg-slate-700" {...props} />,
              td: (props) => <td className="border border-slate-600 px-2 py-1" {...props} />,
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </Modal>
  )
}

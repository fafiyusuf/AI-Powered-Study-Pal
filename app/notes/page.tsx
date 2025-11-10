"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/protected-layout"
import { CreateNoteModal } from "@/components/create-note-modal"
import { useAppStore } from "@/store/useAppStore"

export default function NotesPage() {
  const notes = useAppStore((state) => state.notes)
  const deleteNote = useAppStore((state) => state.deleteNote)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const subjects = Array.from(new Set(notes.map((n) => n.subject)))
  const filteredNotes = selectedSubject ? notes.filter((n) => n.subject === selectedSubject) : notes

  const handleDelete = (id: string) => {
    if (confirm("Delete this note?")) {
      deleteNote(id)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notes</h1>
            <p className="text-slate-400">Create and manage your study notes</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            + New Note
          </button>
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSubject === null ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            All ({notes.length})
          </button>
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSubject === subject
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {subject} ({notes.filter((n) => n.subject === subject).length})
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-indigo-500/50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{note.title}</h3>
                    <p className="text-sm text-indigo-400">{note.subject}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-slate-300 text-sm line-clamp-4 mb-4">{note.content}</p>
                <p className="text-xs text-slate-500">{new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No notes yet. Create your first note to get started!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>

      <CreateNoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </ProtectedLayout>
  )
}

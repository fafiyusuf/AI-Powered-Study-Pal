"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/protected-layout"
import { CreateFlashcardModal } from "@/components/create-flashcard-modal"
import { Flashcard } from "@/components/flashcard"
import { useAppStore } from "@/store/useAppStore"

export default function FlashcardsPage() {
  const flashcards = useAppStore((state) => state.flashcards)
  const deleteFlashcard = useAppStore((state) => state.deleteFlashcard)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const subjects = Array.from(new Set(flashcards.map((f) => f.subject)))
  const filteredCards = selectedSubject ? flashcards.filter((f) => f.subject === selectedSubject) : flashcards

  const handleDelete = (id: string) => {
    if (confirm("Delete this flashcard?")) {
      deleteFlashcard(id)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Flashcards</h1>
            <p className="text-slate-400">Master concepts with interactive flashcards</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            + New Card
          </button>
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSubject === null ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            All ({flashcards.length})
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
              {subject} ({flashcards.filter((f) => f.subject === subject).length})
            </button>
          ))}
        </div>

        {/* Flashcards Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <Flashcard key={card.id} card={card} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No flashcards yet. Create your first card to get started!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Create First Card
            </button>
          </div>
        )}
      </div>

      <CreateFlashcardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </ProtectedLayout>
  )
}

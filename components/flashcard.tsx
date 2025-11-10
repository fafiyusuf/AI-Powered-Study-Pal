"use client"

import { useState } from "react"
import type { Flashcard as FlashcardType } from "@/types/index"

interface FlashcardProps {
  card: FlashcardType
  onDelete: (id: string) => void
}

export function Flashcard({ card, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="h-64 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={`w-full h-full relative transition-transform duration-300 transform ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-6 flex flex-col justify-center items-center text-center border border-indigo-500"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-white text-lg font-semibold line-clamp-6">{card.front}</p>
          <p className="text-indigo-200 text-xs mt-4">Click to reveal answer</p>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-6 flex flex-col justify-center items-center text-center border border-emerald-500"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-white text-lg font-semibold line-clamp-6">{card.back}</p>
          <p className="text-emerald-200 text-xs mt-4">Click to see question</p>
        </div>
      </div>

      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card.id)
          }}
          className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
        >
          Delete
        </button>
        <span
          className={`px-3 py-1 rounded text-xs font-medium ${
            card.difficulty === "easy"
              ? "bg-emerald-600/20 text-emerald-400"
              : card.difficulty === "medium"
                ? "bg-amber-600/20 text-amber-400"
                : "bg-red-600/20 text-red-400"
          }`}
        >
          {card.difficulty}
        </span>
      </div>
    </div>
  )
}

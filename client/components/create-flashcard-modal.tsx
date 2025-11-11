"use client"

import type React from "react"

import { useAppStore } from "@/store/useAppStore"
import { useState } from "react"
import { Modal } from "./modal"

interface CreateFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
}

const subjects = ["React", "TypeScript", "JavaScript", "Calculus", "Biology", "History", "English", "Other"]
const difficulties = ["easy", "medium", "hard"] as const

export function CreateFlashcardModal({ isOpen, onClose }: CreateFlashcardModalProps) {
  const createFlashcardRemote = useAppStore((state) => state.createFlashcardRemote)
  const user = useAppStore((state) => state.user)
  const [formData, setFormData] = useState({
    front: "",
    back: "",
    subject: "React",
    difficulty: "easy" as const,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.front.trim() || !formData.back.trim() || !user) return
    await createFlashcardRemote(formData.front, formData.back, formData.subject, formData.difficulty)
    setFormData({ front: "", back: "", subject: "React", difficulty: "easy" })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Flashcard">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Question (Front)</label>
          <textarea
            name="front"
            value={formData.front}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            rows={3}
            placeholder="Enter the question..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Answer (Back)</label>
          <textarea
            name="back"
            value={formData.back}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            rows={3}
            placeholder="Enter the answer..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Create Card
          </button>
        </div>
      </form>
    </Modal>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Modal } from "./modal"
import { useAppStore } from "@/store/useAppStore"
import type { Note } from "@/types/index"

interface CreateNoteModalProps {
  isOpen: boolean
  onClose: () => void
}

const subjects = ["React", "TypeScript", "JavaScript", "Calculus", "Biology", "History", "English", "Other"]

export function CreateNoteModal({ isOpen, onClose }: CreateNoteModalProps) {
  const addNote = useAppStore((state) => state.addNote)
  const user = useAppStore((state) => state.user)
  const [formData, setFormData] = useState({ title: "", content: "", subject: "React" })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim() || !user) return

    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      content: formData.content,
      subject: formData.subject,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
    }

    addNote(newNote)
    setFormData({ title: "", content: "", subject: "React" })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            placeholder="Note title"
            required
          />
        </div>

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
          <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            rows={6}
            placeholder="Your notes..."
            required
          />
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
            Create Note
          </button>
        </div>
      </form>
    </Modal>
  )
}

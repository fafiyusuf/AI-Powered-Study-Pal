"use client"

import type React from "react"

import { ChatMessage } from "@/components/chat-message"
import { ProtectedLayout } from "@/components/protected-layout"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { generateFlashcardsFromText, generateMockAIResponse, generateStudyNotesFromText, summarizePdf } from "@/services/ai"
import { useAppStore } from "@/store/useAppStore"
import type { ChatMessage as ChatMessageType } from "@/types/index"
import { useEffect, useRef, useState } from "react"

export default function AIChatPage() {
  const chatHistory = useAppStore((state) => state.chatHistory)
  const addChatMessage = useAppStore((state) => state.addChatMessage)
  const clearChatHistory = useAppStore((state) => state.clearChatHistory)
  const addNote = useAppStore((state) => state.addNote)
  const addFlashcard = useAppStore((state) => state.addFlashcard)
  const user = useAppStore((state) => state.user)

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessageType = {
      id: Math.random().toString(36).substr(2, 9),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setInput("")
    setIsLoading(true)

    try {
      // Generate AI response
      const aiResponse = await generateMockAIResponse(input)

      const assistantMessage: ChatMessageType = {
        id: Math.random().toString(36).substr(2, 9),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      }

      addChatMessage(assistantMessage)
    } catch (error) {
      console.error("Error generating response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSummarizePdf = async () => {
    if (!selectedFile || isSummarizing) return
    setIsSummarizing(true)
    try {
      const summary = await summarizePdf(selectedFile)
      const assistantMessage: ChatMessageType = {
        id: Math.random().toString(36).substr(2, 9),
        content: summary,
        role: "assistant",
        timestamp: new Date(),
        kind: "summary",
      }
      addChatMessage(assistantMessage)
      // Clear selection after summarization
      setSelectedFile(null)
    } catch (error) {
      console.error("Error summarizing PDF:", error)
      const assistantMessage: ChatMessageType = {
        id: Math.random().toString(36).substr(2, 9),
        content: "Failed to summarize PDF. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }
      addChatMessage(assistantMessage)
    } finally {
      setIsSummarizing(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleAddSummaryToNotes = (content: string) => {
    if (!user) return
    const title = content.split('\n')[0].slice(0, 60) || "AI Summary"
    addNote({
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      subject: "AI Summary",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
    })
  }

  const handleGenerateFlashcards = async (content: string) => {
    if (generatingFlashcards) return
    setGeneratingFlashcards(true)
    try {
      const cards = await generateFlashcardsFromText({ sourceText: content, subject: 'AI Summary', count: 6 })
      // Add to store
      cards.forEach((c) => {
        addFlashcard({
          id: Math.random().toString(36).substr(2, 9),
          front: c.front,
          back: c.back,
          subject: c.subject,
          difficulty: c.difficulty,
          createdAt: new Date(),
          userId: user?.id || 'anon',
        })
      })
      addChatMessage({
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        timestamp: new Date(),
        content: `Generated ${cards.length} flashcards and added to your collection.`,
        kind: 'text',
      })
    } catch (e) {
      addChatMessage({
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        timestamp: new Date(),
        content: 'Failed to generate flashcards.',
        kind: 'text',
      })
    } finally {
      setGeneratingFlashcards(false)
    }
  }

  const handleGenerateNotes = async (content: string) => {
    if (generatingNotes) return
    setGeneratingNotes(true)
    try {
      const noteResult = await generateStudyNotesFromText({ sourceText: content, subject: 'AI Summary', style: 'detailed' })
      addNote({
        id: Math.random().toString(36).substr(2, 9),
        title: noteResult.title,
        content: noteResult.content,
        subject: noteResult.subject,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user?.id || 'anon',
      })
      addChatMessage({
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        timestamp: new Date(),
        content: 'Refined notes added to your collection.',
        kind: 'text',
      })
    } catch (e) {
      addChatMessage({
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        timestamp: new Date(),
        content: 'Failed to refine notes.',
        kind: 'text',
      })
    } finally {
      setGeneratingNotes(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen flex flex-col">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Study Tutor</h1>
              <p className="text-slate-400">Get instant help with any study topic</p>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={() => clearChatHistory()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-6 overflow-y-auto mb-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-3xl mb-3">🤖</p>
                <p className="text-slate-400 mb-4">Ask me anything about your studies!</p>
                <div className="space-y-2 text-sm text-slate-500">
                  <p>Try asking:</p>
                  <ul className="space-y-1">
                    <li>• "Explain React hooks to me"</li>
                    <li>• "What's a good study strategy?"</li>
                    <li>• "How do flashcards help learning?"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onAddToNotes={handleAddSummaryToNotes}
                  onGenerateFlashcards={handleGenerateFlashcards}
                  onGenerateNotes={handleGenerateNotes}
                  generatingFlashcards={generatingFlashcards}
                  generatingNotes={generatingNotes}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* File Upload + Chat Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isSummarizing}
              className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-500"
            />
            <button
              type="button"
              onClick={handleSummarizePdf}
              disabled={!selectedFile || isSummarizing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSummarizing ? "Summarizing..." : selectedFile ? "Summarize PDF" : "Select PDF"}
            </button>
            <Drawer open={previewOpen} onOpenChange={setPreviewOpen}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  disabled={!selectedFile}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Preview PDF
                </button>
              </DrawerTrigger>
              <DrawerContent side="right" className="bg-slate-900 border-slate-700 w-full sm:max-w-2xl">
                <DrawerHeader className="flex items-center justify-between p-4 border-b border-slate-700">
                  <DrawerTitle className="text-white text-sm">{selectedFile?.name || "PDF Preview"}</DrawerTitle>
                  <DrawerClose asChild>
                    <button className="px-3 py-1 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded">Close</button>
                  </DrawerClose>
                </DrawerHeader>
                <div className="p-0 h-[85vh]">
                  {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No file selected</div>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
            {selectedFile && !isSummarizing && (
              <span className="text-xs text-slate-400 truncate max-w-48">{selectedFile.name}</span>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}

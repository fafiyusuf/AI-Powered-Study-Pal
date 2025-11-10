import type { User, Note, Flashcard, Quiz, QuizQuestion } from "@/types/index"

export const mockUsers: User[] = [
  {
    id: "1",
    email: "student@example.com",
    name: "Alex Student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  },
]

export const mockNotes: Note[] = [
  {
    id: "1",
    title: "React Hooks Basics",
    content:
      "useState, useEffect, useContext are fundamental hooks in React. useState manages local component state...",
    subject: "React",
    createdAt: new Date("2025-11-05"),
    updatedAt: new Date("2025-11-08"),
    userId: "1",
  },
  {
    id: "2",
    title: "TypeScript Interfaces",
    content: "Interfaces define the structure of objects. They are used for type checking and ensuring consistency...",
    subject: "TypeScript",
    createdAt: new Date("2025-11-03"),
    updatedAt: new Date("2025-11-07"),
    userId: "1",
  },
  {
    id: "3",
    title: "Calculus - Derivatives",
    content: "The derivative of a function represents the rate of change. Power rule: d/dx(x^n) = nx^(n-1)...",
    subject: "Calculus",
    createdAt: new Date("2025-11-01"),
    updatedAt: new Date("2025-11-09"),
    userId: "1",
  },
]

export const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    front: "What is useState used for?",
    back: "useState is a React hook that lets you add state to functional components.",
    subject: "React",
    createdAt: new Date("2025-11-06"),
    userId: "1",
    difficulty: "easy",
  },
  {
    id: "2",
    front: "What is the Event Loop?",
    back: "The Event Loop handles asynchronous operations in JavaScript by managing the call stack and callback queue.",
    subject: "JavaScript",
    createdAt: new Date("2025-11-05"),
    userId: "1",
    difficulty: "hard",
  },
  {
    id: "3",
    front: "Define a derivative",
    back: "A derivative measures the rate at which a quantity changes. Graphically, it is the slope of the tangent line.",
    subject: "Calculus",
    createdAt: new Date("2025-11-04"),
    userId: "1",
    difficulty: "medium",
  },
]

const reactQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "What does React.StrictMode do?",
    options: ["Prevents mutations", "Highlights potential problems", "Compiles faster", "Improves performance"],
    correctAnswer: 1,
    explanation: "React.StrictMode helps identify potential problems in the application during development.",
  },
  {
    id: "2",
    question: "Which hook is used for side effects?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correctAnswer: 1,
    explanation: "useEffect is the hook used to handle side effects like data fetching and DOM updates.",
  },
]

export const mockQuizzes: Quiz[] = [
  {
    id: "1",
    title: "React Fundamentals",
    subject: "React",
    questions: reactQuestions,
    createdAt: new Date("2025-11-01"),
    userId: "1",
  },
]

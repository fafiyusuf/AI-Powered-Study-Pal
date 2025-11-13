import express from "express";

import cors from "cors";

import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import aiRoutes from "./modules/ai/ai.route";
import authRoutes from "./modules/auth/auth.route";
import fileRoutes from "./modules/file/file.route";
import flashcardRoutes from "./modules/flashcards/flashcard.route";
import notesRoutes from "./modules/notes/note.route";
import quizRoutes from "./modules/quizzes/quiz.route";

dotenv.config();

const app = express();

app.use(
  cors()
);

app.use(express.json());

// Lightweight request logger for debugging (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}


app.use("/api/auth", authRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/ai", aiRoutes); // canonical AI paths
// Mount specific resource routers first
app.use("/api/notes", notesRoutes);
app.use("/api/quizzes", quizRoutes);
// Finally, expose AI aliases at /api/* to avoid intercepting other routers
app.use("/api", aiRoutes); // also expose /api/chat, /api/summarize, etc.

// Simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 404 for unmatched routes (placed after all routers)
app.use((req, res) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({ success: false, message: "Not found" });
});
app.use(errorHandler);
export default app;

import express from "express";
import multer from "multer";
import { protect } from "../auth/auth.middleware";
import {
    getChatStream,
    postChat,
    postExplain,
    postGenerateFlashcards,
    postGenerateNotes,
    postGenerateQuiz,
    postSummarize,
} from "./ai.controller";

// Configure Multer to use memory storage with an increased file size limit (default 10MB)
const MAX_FILE_SIZE_MB = Number(process.env.AI_MAX_UPLOAD_MB || 10);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    },
});
const router = express.Router();

router.use(protect);

router.post("/chat", postChat);
router.get("/chat/stream", getChatStream);
router.post("/summarize", upload.single("file"), postSummarize);
router.post("/generate-flashcards", postGenerateFlashcards);
router.post("/generate-notes", postGenerateNotes);
router.post("/generate-quiz", postGenerateQuiz);
router.post("/explain", postExplain);

export default router;


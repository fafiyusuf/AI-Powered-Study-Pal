import express from "express";
import { protect } from "../auth/auth.middleware";
import {
    createAttemptHandler,
    createQuizHandler,
    deleteQuizHandler,
    generateQuizHandler,
    getQuizHandler,
    getQuizzesHandler,
    listResultsHandler,
    updateQuizHandler,
} from "./quiz.controller";

const router = express.Router();

// All quiz routes are protected
router.use(protect);

// Generation
router.post("/generate", generateQuizHandler); // POST /api/quizzes/generate

// Attempts and results
router.post("/:id/attempt", createAttemptHandler); // POST /api/quizzes/:id/attempt
router.get("/:id/results", listResultsHandler); // GET /api/quizzes/:id/results

// CRUD
router.get("/", getQuizzesHandler); // GET /api/quizzes
router.post("/", createQuizHandler); // POST /api/quizzes
router.get("/:id", getQuizHandler); // GET /api/quizzes/:id
router.patch("/:id", updateQuizHandler); // PATCH /api/quizzes/:id
router.delete("/:id", deleteQuizHandler); // DELETE /api/quizzes/:id

export default router;


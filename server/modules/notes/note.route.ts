import express from "express";
import { protect } from "../auth/auth.middleware";
import {
  createNewNote,
  deleteExistingNote,
  getNote,
  getNotes,
  importNotesFromFile,
  searchUserNotes,
  updateExistingNote,
} from "./note.controller";

const router = express.Router();

// Protect all notes routes to ensure req.user is available in controllers
router.use(protect);

// Order matters: static paths before dynamic ":id" to avoid conflicts
router.get("/", getNotes);
router.post("/", createNewNote);
router.get("/search", searchUserNotes);
router.post("/import", importNotesFromFile);
router.get("/:id", getNote);
router.patch("/:id", updateExistingNote);
router.delete("/:id", deleteExistingNote);

export default router;

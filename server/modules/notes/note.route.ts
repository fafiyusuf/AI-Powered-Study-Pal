import express from "express";
import {
  getNotes,
  getNote,
  createNewNote,
  updateExistingNote,
  deleteExistingNote,
  importNotesFromFile,
  searchUserNotes,
} from "./note.controller";
//import { protect } from "../auth/auth.middleware";

const router = express.Router();

//router.use(protect); 

router.get("/", getNotes);
router.post("/", createNewNote);
router.get("/:id", getNote);
router.patch("/:id", updateExistingNote);
router.delete("/:id", deleteExistingNote);
router.post("/import", importNotesFromFile);
router.get("/search", searchUserNotes);

export default router;

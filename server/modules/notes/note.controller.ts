import { Request, Response, NextFunction } from "express";
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  importNotes,
  searchNotes,
} from "./note.service";
import { CustomError } from "../../utils/customError";

export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const notes = await getAllNotes(userId);
    res.status(200).json({ success: true, notes });
  } catch (err) {
    next(err);
  }
};

export const getNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await getNoteById(req.params.id);
    if (!note) throw new CustomError("Note not found", 404);
    res.status(200).json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

export const createNewNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, tags } = req.body;
    if (!title || !content) throw new CustomError("Title and content are required", 400);

    const note = await createNote({ title, content, tags, userId });
    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

export const updateExistingNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await updateNote(req.params.id, req.body);
    res.status(200).json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

export const deleteExistingNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteNote(req.params.id);
    res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const importNotesFromFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { notesData } = req.body;
    if (!Array.isArray(notesData)) throw new CustomError("Invalid notes data format", 400);

    const imported = await importNotes(notesData, userId);
    res.status(201).json({ success: true, imported });
  } catch (err) {
    next(err);
  }
};

export const searchUserNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { q } = req.query;
    if (!q) throw new CustomError("Search query is required", 400);

    const results = await searchNotes(q as string, userId);
    res.status(200).json({ success: true, results });
  } catch (err) {
    next(err);
  }
};

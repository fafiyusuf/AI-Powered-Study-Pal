import express from "express";

import cors from "cors";

import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.route";
import fileRoutes from "./modules/file/file.route";
import flashcardRoutes from "./modules/flashcards/flashcard.route";
import notesRoutes from "./modules/notes/note.route"

dotenv.config();

const app = express();

app.use(
  cors()
);

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/notes",notesRoutes)



app.use(errorHandler);
export default app;

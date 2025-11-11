import express from "express";

import cors from "cors";

import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import aiRoutes from "./modules/ai/ai.route";
import authRoutes from "./modules/auth/auth.route";
import fileRoutes from "./modules/file/file.route";
import flashcardRoutes from "./modules/flashcards/flashcard.route";

dotenv.config();

const app = express();

app.use(
  cors()
);

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/ai", aiRoutes);



app.use(errorHandler);
export default app;

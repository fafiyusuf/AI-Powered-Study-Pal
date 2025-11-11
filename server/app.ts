import express from "express";

import cors from "cors";

import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.route";
import fileRoutes from "./modules/file/file.route";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();

app.use(
  cors()
);

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/file", fileRoutes);



app.use(errorHandler);
export default app;

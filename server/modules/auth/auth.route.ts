import express from "express";
import { registerUser, loginUser } from "./auth.controller";
import { protect } from "./auth.middleware";
import { Request, Response } from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;

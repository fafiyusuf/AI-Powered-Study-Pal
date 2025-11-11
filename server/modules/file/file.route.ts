import express from "express";
import upload  from "../../config/multer";
import {  uploadStudyFile } from "./file.controller";
import { protect } from "../auth/auth.middleware";

const router = express.Router();
// const upload = createUploader({ file: ["jpg", "jpeg", "png", "pdf", "txt", "docx"] });

router.post("/upload", upload.single("file"), uploadStudyFile);
// router.get("/:fileId", openFile);

export default router;

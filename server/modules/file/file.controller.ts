import { Request, Response, NextFunction } from "express";
import { saveStudyFile } from "./file.service";
import { CustomError } from "../../utils/customError";

export const uploadStudyFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) throw new CustomError("No file uploaded", 400);

    const savedFile = await saveStudyFile(file as any);

    res.status(201).json({
      success: true,
      message: "Study file uploaded successfully",
      file: savedFile,
    });
  } catch (err) {
    next(err);
  }
};

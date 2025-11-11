import { Request, Response, NextFunction } from "express";
import { saveStudyFile } from "./file.service";
import { CustomError } from "../../utils/customError";
import { genController } from "../ai/ai.service"

export const uploadStudyFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) throw new CustomError("No file uploaded", 400);

    const savedFile = await saveStudyFile(file as any);
    const fileUrl = savedFile.path;
   
    const aiSummary = await genController(fileUrl);
    const summaryContent = aiSummary?.candidates?.[0]?.content?.parts?.[0].text;
    console.log(summaryContent ?? "AI summary content not available.");
 
    res.status(201).json({
      success: true,
      message: "Study file uploaded successfully",
      file: savedFile,
      aiSummary: summaryContent,
    });
  } catch (err) {
    next(err);
  }
};

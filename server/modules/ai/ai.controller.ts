import { NextFunction, Response } from "express";
import { CustomError } from "../../utils/customError";
import { AuthRequest } from "../auth/auth.middleware";
import {
    chatCompletion,
    chatCompletionStream,
    explainTextLLM,
    generateFlashcardsLLM,
    generateNotesLLM,
    generateQuizLLM,
    summarizePdfBuffer,
    summarizeText,
} from "./ai.service";

export const postChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { messages } = req.body as { messages: { role: "user" | "assistant"; content: string }[] };
		if (!Array.isArray(messages) || messages.length === 0) throw new CustomError("messages array required", 400);
		const reply = await chatCompletion(messages);
		res.json({ success: true, data: { reply } });
	} catch (err) {
		next(err);
	}
};

export const getChatStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const prompt = (req.query.prompt as string) || (req.body?.prompt as string);
		if (!prompt) throw new CustomError("prompt required", 400);
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		await chatCompletionStream(prompt, (delta) => {
			res.write(`data: ${JSON.stringify({ delta })}\n\n`);
		});
		res.write("event: done\n");
		res.write("data: {}\n\n");
		res.end();
	} catch (err) {
		next(err);
	}
};

export const postSummarize = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const file = req.file;
		if (file) {
			// Validate file type early for clearer client errors
			if (!file.mimetype?.includes("pdf")) {
				throw new CustomError("File must be a PDF (application/pdf)", 400);
			}
			const summary = await summarizePdfBuffer(file);
			return res.json({ success: true, summary });
		}
		const { text } = req.body as { text?: string };
		if (!text) {
			// Multer did not populate req.file and no text provided
			throw new CustomError("File field 'file' is required (multipart/form-data) or provide 'text'", 400);
		}
		const summary = await summarizeText(text);
		res.json({ success: true, summary });
	} catch (err) {
		// Additional targeted log for summarize path; structured logging happens in error handler
		// eslint-disable-next-line no-console
		console.error("[postSummarize] Error:", (err as any)?.message || err);
		next(err);
	}
};

export const postGenerateFlashcards = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { sourceText, subject, count } = req.body as { sourceText: string; subject?: string; count?: number };
		if (!sourceText) throw new CustomError("sourceText required", 400);
		const cards = await generateFlashcardsLLM(sourceText, subject, count);
		res.json({ success: true, flashcards: cards });
	} catch (err) {
		next(err);
	}
};

export const postGenerateNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { sourceText, subject, style } = req.body as { sourceText: string; subject?: string; style?: "concise"|"detailed"|"outline" };
		if (!sourceText) throw new CustomError("sourceText required", 400);
		const note = await generateNotesLLM(sourceText, subject, style);
		res.json({ success: true, note });
	} catch (err) {
		next(err);
	}
};

export const postGenerateQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { sourceText, subject, count } = req.body as { sourceText: string; subject?: string; count?: number };
		if (!sourceText) throw new CustomError("sourceText required", 400);
		const quiz = await generateQuizLLM(sourceText, subject, count);
		res.json({ success: true, quiz });
	} catch (err) {
		next(err);
	}
};

export const postExplain = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { sourceText, question } = req.body as { sourceText: string; question?: string };
		if (!sourceText) throw new CustomError("sourceText required", 400);
		const explanation = await explainTextLLM(sourceText, question);
		res.json({ success: true, explanation });
	} catch (err) {
		next(err);
	}
};



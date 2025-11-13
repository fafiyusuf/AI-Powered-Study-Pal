import { NextFunction, Response } from "express";
import { AuthRequest } from "../auth/auth.middleware";
import {
    createAttempt,
    createQuiz,
    deleteQuiz,
    generateQuiz,
    getQuizById,
    listAttempts,
    listQuizzes,
    updateQuiz,
} from "./quiz.service";

export const getQuizzesHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const quizzes = await listQuizzes(userId);
		res.json({ success: true, data: quizzes });
	} catch (err) {
		next(err);
	}
};

export const createQuizHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { title, description, questions } = req.body as {
			title: string;
			description?: string | null;
			questions?: { question: string; answer: string }[];
		};
		const quiz = await createQuiz(userId, { title, description, questions });
		res.status(201).json({ success: true, data: quiz });
	} catch (err) {
		next(err);
	}
};

export const getQuizHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { id } = req.params;
		const quiz = await getQuizById(userId, id);
		res.json({ success: true, data: quiz });
	} catch (err) {
		next(err);
	}
};

export const updateQuizHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { id } = req.params;
		const { title, description, questions } = req.body as {
			title?: string;
			description?: string | null;
			questions?: { question: string; answer: string }[];
		};
		const quiz = await updateQuiz(userId, id, { title, description, questions });
		res.json({ success: true, data: quiz });
	} catch (err) {
		next(err);
	}
};

export const deleteQuizHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { id } = req.params;
		await deleteQuiz(userId, id);
		res.json({ success: true, message: "Quiz deleted" });
	} catch (err) {
		next(err);
	}
};

export const createAttemptHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { id } = req.params; // quizId
		const { answers, score } = req.body as { answers: any; score: number };
		const attempt = await createAttempt(userId, id, { answers, score });
		res.status(201).json({ success: true, data: attempt });
	} catch (err) {
		next(err);
	}
};

export const listResultsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { id } = req.params; // quizId
		const attempts = await listAttempts(userId, id);
		res.json({ success: true, data: attempts });
	} catch (err) {
		next(err);
	}
};

export const generateQuizHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user!.id;
		const { sourceText, title, subject, count } = req.body as {
			sourceText: string;
			title?: string;
			subject?: string;
			count?: number;
		};
		const quiz = await generateQuiz(userId, { sourceText, title, subject, count });
		res.status(201).json({ success: true, data: quiz });
	} catch (err) {
		next(err);
	}
};


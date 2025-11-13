import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { CustomError } from "../../utils/customError";
import { generateQuizLLM } from "../ai/ai.service"; // <-- FIX: Import the AI function

export interface QuizQuestionInput {
	question: string;
	answer: string;
}

export interface CreateQuizInput {
	title: string;
	description?: string | null;
	questions?: QuizQuestionInput[];
}

export interface UpdateQuizInput {
	title?: string;
	description?: string | null;
	questions?: QuizQuestionInput[]; // when provided, will replace existing questions
}

export const listQuizzes = async (userId: string) => {
	return prisma.quiz.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			description: true,
			userId: true,
			createdAt: true,
			updatedAt: true,
			_count: { select: { questions: true, attempts: true } },
		},
	});
};

export const getQuizById = async (userId: string, id: string) => {
	const quiz = await prisma.quiz.findFirst({
		where: { id, userId },
		include: { questions: { orderBy: { createdAt: "asc" } } },
	});
	if (!quiz) throw new CustomError("Quiz not found", 404);
	return quiz;
};

export const createQuiz = async (userId: string, input: CreateQuizInput) => {
	const { title, description = null, questions = [] } = input;
	if (!title?.trim()) throw new CustomError("Title is required", 400);
	return prisma.quiz.create({
		data: {
			title,
			description,
			userId,
			questions: {
				createMany: {
					data: questions,
					skipDuplicates: true,
				},
			},
		},
	});
};

export const updateQuiz = async (userId: string, id: string, input: UpdateQuizInput) => {
	const quiz = await prisma.quiz.findFirst({ where: { id, userId } });
	if (!quiz) throw new CustomError("Quiz not found", 404);

	// If questions are provided, delete existing ones and create new ones
	if (input.questions) {
		await prisma.question.deleteMany({ where: { quizId: id } });
	}

	return prisma.quiz.update({
		where: { id },
		data: {
			title: input.title,
			description: input.description,
			questions: input.questions
				? {
						createMany: {
							data: input.questions,
							skipDuplicates: true,
						},
				  }
				: undefined,
		},
	});
};

export const deleteQuiz = async (userId: string, id: string) => {
	const quiz = await prisma.quiz.findFirst({ where: { id, userId } });
	if (!quiz) throw new CustomError("Quiz not found", 404);

	await prisma.quizAttempt.deleteMany({ where: { quizId: id } });
	await prisma.question.deleteMany({ where: { quizId: id } });
	await prisma.quiz.delete({ where: { id } });
	return true;
};

interface AttemptAnswer {
	questionId: string;
	selectedAnswer: string;
}

interface CreateAttemptInput {
	answers: AttemptAnswer[];
	score: number;
}

export const createAttempt = async (userId: string, quizId: string, input: CreateAttemptInput) => {
	const quiz = await prisma.quiz.findFirst({ where: { id: quizId, userId } });
	if (!quiz) throw new CustomError("Quiz not found", 404);

	return prisma.quizAttempt.create({
		data: {
			quizId,
			userId,
			score: input.score,
			// Cast to Prisma.InputJsonValue to satisfy TS for JSON column
			answers: input.answers as unknown as Prisma.InputJsonValue,
		},
	});
};

export const listAttempts = async (userId: string, quizId: string) => {
	// Only attempts by this user for their own quiz
	const quiz = await prisma.quiz.findFirst({ where: { id: quizId, userId } });
	if (!quiz) throw new CustomError("Quiz not found", 404);
	return prisma.quizAttempt.findMany({ where: { quizId, userId }, orderBy: { createdAt: "desc" } });
};

export interface GenerateQuizInput {
	sourceText: string;
	title?: string;
	subject?: string;
	count?: number;
}

export const generateQuiz = async (userId: string, input: GenerateQuizInput) => {
	const source = input.sourceText?.toString() || "";
	if (!source.trim()) throw new CustomError("sourceText is required", 400);

	const count = typeof input.count === "number" && input.count > 0 ? Math.min(input.count, 15) : 5;
	const subject = input.subject?.toString().trim() || "General";
	const title = input.title?.toString().trim() || `${subject} Quiz`;

	// FIX: Use the AI service to generate a comprehensive quiz
    const aiQuiz = await generateQuizLLM(source, subject, count);

	// The AI quiz format (multiple choice) must be mapped to the database's simple Q/A format.
	const questions: QuizQuestionInput[] = aiQuiz.questions.map((q: any) => {
		// Find the correct answer text
		const answerText = q.options?.[q.answerIndex] ?? "";

		// Format the question to include options and explanation for reference
		const formattedQuestion = `${q.question}\n\nOptions:\n${q.options
			.map((opt: string, index: number) => `  ${index + 1}. ${opt}`)
			.join("\n")}\n\nExplanation:\n${q.explanation || "N/A"}`;

		return {
			question: formattedQuestion, // Store formatted question text with options
			answer: answerText, // Store the correct option's text as the answer
		};
	}).filter((q: QuizQuestionInput) => q.question.length > 0 && q.answer.length > 0);
    
    if (questions.length === 0) {
        throw new CustomError("AI failed to generate any valid questions from the source text. Please try a different source.", 422);
    }
    
	// Use AI title if available, otherwise use the generated one
	const finalTitle = aiQuiz.title?.trim() || title;

	// Create the quiz in the database
	return createQuiz(userId, { 
        title: finalTitle, 
        description: `Generated by AI from ${subject} source.`, 
        questions 
    });
};
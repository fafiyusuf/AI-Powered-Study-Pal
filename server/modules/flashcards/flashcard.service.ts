import { prisma } from "../../lib/prisma";
import { CustomError } from "../../utils/customError";
import { generateFlashcardsLLM } from "../ai/ai.service";

export interface CreateFlashcardInput {
	question: string;
	answer: string;
	tags?: string[];
}

export interface UpdateFlashcardInput {
	question?: string;
	answer?: string;
	tags?: string[];
}

export const listFlashcards = async (
	userId: string,
	opts?: { tag?: string }
) => {
	const { tag } = opts || {};
	return prisma.flashcard.findMany({
		where: {
			userId,
			...(tag ? { tags: { has: tag } } : {}),
		},
		orderBy: { createdAt: "desc" },
	});
};

export const createFlashcard = async (
	userId: string,
	payload: CreateFlashcardInput
) => {
	const { question, answer, tags = [] } = payload;
	if (!question?.trim() || !answer?.trim()) {
		throw new CustomError("Question and answer are required", 400);
	}
	return prisma.flashcard.create({
		data: { question: question.trim(), answer: answer.trim(), tags, userId },
	});
};

export const getFlashcardById = async (userId: string, id: string) => {
	const card = await prisma.flashcard.findFirst({ where: { id, userId } });
	if (!card) throw new CustomError("Flashcard not found", 404);
	return card;
};

export const updateFlashcard = async (
	userId: string,
	id: string,
	payload: UpdateFlashcardInput
) => {
	// Ensure ownership
	const existing = await prisma.flashcard.findFirst({ where: { id, userId } });
	if (!existing) throw new CustomError("Flashcard not found", 404);

	const data: UpdateFlashcardInput = {};
	if (payload.question !== undefined) data.question = payload.question;
	if (payload.answer !== undefined) data.answer = payload.answer;
	if (payload.tags !== undefined) data.tags = payload.tags;

	return prisma.flashcard.update({ where: { id }, data });
};

export const deleteFlashcard = async (userId: string, id: string) => {
	// Ensure ownership
	const existing = await prisma.flashcard.findFirst({ where: { id, userId } });
	if (!existing) throw new CustomError("Flashcard not found", 404);
	await prisma.flashcard.delete({ where: { id } });
	return { success: true } as const;
};

export interface GenerateFlashcardsInput {
	sourceText: string;
	subject?: string;
	count?: number;
}

export const generateFlashcards = async (
	userId: string,
	input: GenerateFlashcardsInput
) => {
	const source = input.sourceText?.toString() || "";
	const subject = input.subject?.toString().trim() || "General";
	const count = typeof input.count === "number" && input.count > 0 ? Math.min(input.count, 20) : 5;

	if (!source.trim()) {
		throw new CustomError("sourceText is required", 400);
	}

	// Try LLM-backed generation first
	let mapped: { question: string; answer: string; tags: string[] }[] = [];
	try {
		const aiCards = await generateFlashcardsLLM(source, subject, count);
		mapped = (aiCards || []).map((c: any) => ({
			question: String(c.front ?? c.question ?? "").trim() || "Generated question",
			answer: String(c.back ?? c.answer ?? "").trim() || "",
			tags: [String(c.subject || subject)],
		})).filter(c => c.question && c.answer);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('[flashcards.generate] LLM failed, falling back to heuristic:', (e as any)?.message || e);
	}

	// Fallback: primitive heuristic if LLM returned nothing
	if (!mapped.length) {
		const sentences = source
			.replace(/\s+/g, " ")
			.split(/[.!?]\s+/)
			.map((s) => s.trim())
			.filter(Boolean);
		for (let i = 0; i < count; i++) {
			const base = sentences[i % Math.max(1, sentences.length)] || source.slice(0, 140);
			const question = `What is the key idea of: "${base.slice(0, 100)}"?`;
			const answer = base.length > 0 ? base : "A core concept from the provided text.";
			mapped.push({ question, answer, tags: [subject] });
		}
	}

	const created = await prisma.$transaction(
		mapped.map((c) =>
			prisma.flashcard.create({
				data: { userId, question: c.question, answer: c.answer, tags: c.tags },
			})
		)
	);

	return created;
};

export const getFlashcardStats = async (userId: string) => {
	const [total, recent] = await Promise.all([
		prisma.flashcard.count({ where: { userId } }),
		prisma.flashcard.count({
			where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
		}),
	]);

	const all = await prisma.flashcard.findMany({ where: { userId }, select: { tags: true } });
	const byTag: Record<string, number> = {};
	for (const row of all) {
		for (const t of row.tags || []) byTag[t] = (byTag[t] || 0) + 1;
	}

	return { total, createdLast7Days: recent, byTag };
};


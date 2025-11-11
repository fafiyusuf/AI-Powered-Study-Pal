import { GoogleGenerativeAI } from "@google/generative-ai";
import { CustomError } from "../../utils/customError";
// pdf-parse has no proper TS types; declare a minimal signature
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (data: Buffer) => Promise<{ text: string }> = require("pdf-parse");

const MODEL_CHAT = process.env.GEMINI_MODEL_CHAT || "gemini-1.5-flash";
const MODEL_REASON = process.env.GEMINI_MODEL_REASON || "gemini-1.5-pro";

function getClient() {
  const key = process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    // Surface a clear message to clients (500 since it's a server misconfiguration)
    throw new CustomError(
      "Server misconfigured: missing GENAI_API_KEY or GEMINI_API_KEY.",
      500
    );
  }
  return new GoogleGenerativeAI(key);
}

export async function chatCompletion(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const prompt = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_CHAT });
  const res = await model.generateContent(prompt + "\nAssistant:");
  return res.response.text();
}

export async function chatCompletionStream(prompt: string, onChunk: (delta: string) => void) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_CHAT });
  const stream = await model.generateContentStream(prompt);
  for await (const chunk of stream.stream) {
    const t = chunk.text();
    if (t) onChunk(t);
  }
}

export async function summarizePdfBuffer(file: Express.Multer.File) {
  const mimetype = file.mimetype || "";
  if (!mimetype.includes("pdf")) {
    throw new CustomError("Only PDF summarization is supported in this endpoint.", 400);
  }
  try {
    const parsed = await pdfParse(file.buffer);
    const text = parsed.text?.trim();
    if (!text) return "(No extractable text found in PDF)";
    return await summarizeText(text);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[summarizePdfBuffer] pdf-parse failed:", e?.message || e);
    throw new CustomError("Failed to read PDF. Please try another file.", 422);
  }
}

export async function summarizeText(text: string) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_REASON });
  const prompt = `You are a helpful study assistant. Summarize the content with headings, bullet points, core concepts, definitions, and examples.\n\nCONTENT:\n${text}`;
  try {
    const res = await model.generateContent(prompt);
    return res.response.text();
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[summarizeText] model.generateContent failed:", e?.message || e);
    throw new CustomError("AI summarization failed. Check API key and model configuration.", 502);
  }
}

export async function generateFlashcardsLLM(sourceText: string, subject = "General", count = 5) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_CHAT });
  const prompt = `Create ${count} study flashcards from the content. Output ONLY valid JSON array like: [{"front":"...","back":"...","subject":"${subject}","difficulty":"easy"|"medium"|"hard"}, ...]. No prose outside JSON.\n\nCONTENT:\n${sourceText}`;
  const res = await model.generateContent(prompt);
  const txt = res.response.text().trim();
  try {
    const json = JSON.parse(txt);
    if (Array.isArray(json)) return json;
  } catch {}
  // Fallback naive generation
  const lines = sourceText.split(/\n+/).filter(Boolean);
  const cards = [] as any[];
  for (let i = 0; i < Math.max(1, Math.min(count, 10)); i++) {
    const base = lines[i % lines.length]?.slice(0, 120) || sourceText.slice(0, 120) || "Concept";
    cards.push({ front: `Explain: ${base}?`, back: base, subject, difficulty: "easy" });
  }
  return cards;
}

export async function generateNotesLLM(sourceText: string, subject = "AI Generated", style: "concise"|"detailed"|"outline" = "outline") {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_REASON });
  const prompt = `Produce ${style} study notes for subject '${subject}'. Return ONLY JSON object: {"title": string, "content": string, "subject": string}.\n\nCONTENT:\n${sourceText}`;
  const res = await model.generateContent(prompt);
  const txt = res.response.text().trim();
  try {
    const json = JSON.parse(txt);
    if (json && json.title && json.content) return json;
  } catch {}
  return { title: subject, content: txt || sourceText.slice(0, 500), subject };
}

export async function generateQuizLLM(sourceText: string, subject = "General", count = 5) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_REASON });
  const prompt = `Create a ${count}-question multiple-choice quiz about '${subject}'. Output ONLY JSON: {"title": string, "questions": [{"question": string, "options": string[], "answerIndex": number, "explanation": string}]}.\n\nCONTENT:\n${sourceText}`;
  const res = await model.generateContent(prompt);
  const txt = res.response.text().trim();
  try {
    const j = JSON.parse(txt);
    if (j && Array.isArray(j.questions)) return j;
  } catch {}
  return { title: `${subject} Quiz`, questions: [] };
}

export async function explainTextLLM(sourceText: string, question?: string) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_CHAT });
  const prompt = `Explain the following${question ? ` in context of: ${question}` : ''} with clear reasoning, examples, and simplified breakdown where helpful:\n\n${sourceText}`;
  const res = await model.generateContent(prompt);
  return res.response.text();
}

// Legacy function kept for file.controller compatibility
export const genController = async (fileUrl: string) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_REASON });
  const prompt = `Analyze the file located at ${fileUrl} and produce a high-quality, well-structured summary. If file content is not accessible by URL alone, state limitation.`;
  const response = await model.generateContent(prompt);
  return response.response;
};
 

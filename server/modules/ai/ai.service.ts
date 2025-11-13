import { GoogleGenerativeAI } from "@google/generative-ai";
import { CustomError } from "../../utils/customError";
// pdf-parse has mixed CJS/ESM exports across versions; normalize to function
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseModule = require("pdf-parse");

// Normalize parsing across versions. Some versions export a function (old), others a class PDFParse (new)
async function parsePdfBuffer(data: Buffer): Promise<{ text: string }> {
	const mod: any = pdfParseModule;
	const extractText = (result: any): string | null => {
		if (!result) return null;
		if (typeof result === "string") return result;
		if (typeof result.text === "string") return result.text;
		if (Array.isArray(result.pages)) {
			const pages = result.pages
				.map((page: any) => (typeof page === "string" ? page : page?.text))
				.filter(Boolean);
			if (pages.length) return pages.join("\n\n");
		}
		return null;
	};

	// Try the pdf-parse function directly (most common CJS export)
	if (typeof mod === "function") {
		try {
			const parsed = await mod(data);
			const text = extractText(parsed);
			if (text) return { text };
		} catch (parseErr) {
			// eslint-disable-next-line no-console
			console.warn('[pdf-parse] direct function invocation failed:', (parseErr as any)?.message || parseErr);
		}
	}

	// Try CJS export with default, PDFParse, etc.
	const parserConstructors = [mod?.PDFParse, mod?.default?.PDFParse].filter(
		(ctor: any) => typeof ctor === "function"
	);
	
	for (const ParserCtor of parserConstructors) {
		let parser: any;
		try {
			// Create a buffer for parser if necessary, though most accept Buffer directly
			const uint8 = toPlainUint8(data);
			parser = new ParserCtor({ data: uint8, verbosity: 0 }); // Use verbosity 0 to silence warnings

			if (typeof parser.parse === "function") {
				try {
					const parsed = await parser.parse();
					const text = extractText(parsed);
					if (text) return { text };
				} catch (parseErr) {
					// eslint-disable-next-line no-console
					console.warn('[pdf-parse] parser.parse invocation failed:', (parseErr as any)?.message || parseErr);
				}
			}
		} catch (ctorErr) {
			// eslint-disable-next-line no-console
			console.warn('[pdf-parse] PDFParse constructor invocation failed:', (ctorErr as any)?.message || ctorErr);
		} finally {
			if (parser && typeof parser.destroy === "function") {
				try {
					await parser.destroy();
				} catch (destroyErr) {
					// eslint-disable-next-line no-console
					console.warn('[pdf-parse] parser.destroy failed:', (destroyErr as any)?.message || destroyErr);
				}
			}
		}
	}

	throw new Error("pdf-parse could not extract text using the available methods.");
}


// Fallback extractor using pdfjs-dist when pdf-parse fails in this environment
async function extractPdfTextWithPdfjs(buffer: Buffer): Promise<string> {
	// Use a minimal require path to load pdfjs-dist
	function loadPdfJsLib(): any {
		try { return require('pdfjs-dist/legacy/build/pdf.js'); } catch {}
		try { return require('pdfjs-dist/build/pdf.js'); } catch {}
		try { return require('pdfjs-dist'); } catch {}
		throw new Error("Cannot load pdfjs-dist module");
	}

	try {
		const mod = loadPdfJsLib();
		const pdfjsLib: any = mod?.default || mod;
		if (!pdfjsLib?.getDocument) throw new Error('pdfjs-dist getDocument not available');
		
		// --- Fixes for Node.js environment (Disables font/worker failures) ---
		if (pdfjsLib.GlobalWorkerOptions) {
			try {
				// Require the worker path to ensure it's found if needed (even though we disable the worker)
				pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');
			} catch (e) {
				// eslint-disable-next-line no-console
				console.warn('[pdfjs-dist] Failed to set workerSrc, proceeding without.', (e as any)?.message);
			}
		}
		
		const uint8 = toPlainUint8(buffer);
		
		// Disable font loading and workers to prevent errors in Node.js
		const loadingTask = pdfjsLib.getDocument({
			data: uint8,
			isEvalSupported: false,
			useWorkerFetch: false,
			disableFontFace: true, 
			disableWorker: true,   
			stopAtErrors: true,
		});
		
		const pdf = await loadingTask.promise;
		let fullText = '';
		const maxPages = Math.min(pdf.numPages || 1, 200); // safety cap
		for (let i = 1; i <= maxPages; i++) {
			const page = await pdf.getPage(i);
			const content = await page.getTextContent();
			const strings = content.items.map((it: any) => (it?.str ?? '')).filter(Boolean);
			const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();
			if (pageText) fullText += (fullText ? '\n\n' : '') + pageText;
		}
		return fullText.trim();
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('[pdfjs-dist] extract failed:', (e as any)?.message || e);
		throw e;
	}
}

// Helper to convert data types
function toPlainUint8(data: Buffer | Uint8Array): Uint8Array {
	const isBuffer = typeof Buffer !== "undefined" && Buffer.isBuffer(data);
	if (isBuffer) {
		return new Uint8Array(data);
	}
	if (data instanceof Uint8Array) {
		return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	}
	return new Uint8Array(data as ArrayBuffer);
}


// --- Constants & Client Setup ---

// FIX: Unified models to use the free-tier "flash" version for all services.
const DEFAULT_FLASH_MODEL = "gemini-2.5-flash"; 
const MODEL_CHAT = process.env.GEMINI_MODEL_CHAT || DEFAULT_FLASH_MODEL;
const MODEL_REASON = process.env.GEMINI_MODEL_REASON || DEFAULT_FLASH_MODEL;
const MAX_REMOTE_MB = Number(process.env.AI_MAX_UPLOAD_MB || 10);

const resolvedModelCache = new Map<string, string>();

function getClient() {
	const key = process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY;
	if (!key) {
		throw new CustomError(
			"Server misconfigured: missing GENAI_API_KEY or GEMINI_API_KEY.",
			500
		);
	}
	return new GoogleGenerativeAI(key);
}

function toCustomAIError(e: any, fallbackMsg = "AI request failed. Check API key, model, and quota.") {
	const statusFromErr = Number(e?.status || e?.statusCode);
	const message = e?.message || fallbackMsg;
	// Added 503 from your last error
	const allowed = [400, 401, 403, 404, 409, 413, 415, 429, 503]; 
	const status = allowed.includes(statusFromErr) ? statusFromErr : 502;
	return new CustomError(message, status);
}

function shouldRetryWithLatest(modelName: string, err: any) {
	if (!modelName || modelName.endsWith("-latest")) return false;
	const status = Number(err?.status || err?.statusCode);
	// Retry on 404 (Model not found) or 503 (Overloaded/quota)
	if (status === 404 || status === 503) return true; 
	const message = String(err?.message || "").toLowerCase();
	return message.includes("not found") && message.includes("models/");
}

function appendLatestSuffix(modelName: string) {
	if (!modelName || modelName.endsWith("-latest")) return modelName;
	if (/-\d+$/.test(modelName)) return modelName;
	return `${modelName}-latest`;
}

// FIX: Re-added crucial model fallback logic for reliability
async function runWithModelFallback<T>(initialModel: string, executor: (modelName: string) => Promise<T>): Promise<T> {
	const cached = resolvedModelCache.get(initialModel);
	const primary = cached || initialModel;
	try {
		const result = await executor(primary);
		resolvedModelCache.set(initialModel, primary);
		return result;
	} catch (err) {
		if (!shouldRetryWithLatest(primary, err)) throw err;
		const fallback = appendLatestSuffix(primary);
		if (!fallback || fallback === primary) throw err;
		// eslint-disable-next-line no-console
		console.warn(`[ai-model] Retrying with fallback model ${fallback} after failure of ${primary}:`, (err as any)?.message || err);
		const result = await executor(fallback);
		resolvedModelCache.set(initialModel, fallback);
		return result;
	}
}


// --- Files API helpers (best-effort) ---
function getFileManager(): any | null {
	try {
	  // Newer SDK exposes file manager from this path
	  // eslint-disable-next-line @typescript-eslint/no-var-requires
	  const files = require("@google/generative-ai/files");
	  if (files?.GoogleAIFileManager) {
		const key = process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY;
		if (!key) return null;
		return new files.GoogleAIFileManager({ apiKey: key });
	  }
	} catch {
	  // Module not available in this SDK version
	}
	return null;
  }

async function tryUploadToGemini(buffer: Buffer, mimeType: string, displayName?: string): Promise<{ fileUri: string; mimeType: string } | null> {
// ... (omitted for brevity)
	const fm = getFileManager();
	if (!fm) return null;
	try {
	  // Try common calling conventions
	  // 1) uploadFile({ file: { data, mimeType }, displayName })
	  try {
		const r = await fm.uploadFile({ file: { data: buffer, mimeType }, displayName: displayName || "uploaded-file" });
		const uri = r?.file?.uri || r?.fileUri || r?.uri;
		const mt = r?.file?.mimeType || mimeType;
		if (uri) return { fileUri: uri, mimeType: mt };
	  } catch (e) {
		// 2) uploadFile(blob, { mimeType, displayName }) if first form not supported
		const BlobCtor: any = (global as any).Blob;
		if (BlobCtor) {
		  const blob: any = new BlobCtor([buffer], { type: mimeType });
		  const r = await fm.uploadFile(blob, { mimeType, displayName: displayName || "uploaded-file" });
		  const uri = r?.file?.uri || r?.fileUri || r?.uri;
		  const mt = r?.file?.mimeType || mimeType;
		  if (uri) return { fileUri: uri, mimeType: mt };
		}
		// Could not use Blob path; fall through to overall catch and return null
		// eslint-disable-next-line no-console
		console.warn("[FilesAPI] uploadFile unsupported signature:", (e as any)?.message || e);
		return null;
	  }
	  // Neither path produced a URI, treat as failure
	  return null;
	} catch (e: any) {
	  // eslint-disable-next-line no-console
	  console.warn("[FilesAPI] Upload failed, will fallback:", e?.message || e);
	  return null;
	}
}

async function summarizeViaFilesAPI(buffer: Buffer, mimeType: string, displayName: string, instruction: string) {
	const uploaded = await tryUploadToGemini(buffer, mimeType, displayName);
	if (!uploaded) return null;
	const client = getClient();
	try {
		return await runWithModelFallback(MODEL_REASON, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent([
				{ text: instruction },
				{ fileData: { fileUri: (uploaded as any).fileUri, mimeType: uploaded.mimeType } as any },
			] as any);
			return res.response.text();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.warn("[FilesAPI] generateContent with fileData failed, will fallback:", e?.message || e);
		return null;
	}
}

// --- Remote Fetch & Extraction ---
async function fetchRemote(url: string) {
// ... (omitted for brevity)
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30_000);
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) {
			throw new CustomError(`Failed to fetch file: HTTP ${res.status}`, res.status);
		}
		return res;
	} catch (e: any) {
		if (e?.name === 'AbortError') throw new CustomError('Timed out fetching remote file', 504);
		throw new CustomError(e?.message || 'Failed to fetch remote file', 502);
	}
}

function bytesToMB(n: number) {
	return Math.round((n / (1024 * 1024)) * 100) / 100;
}

function isProbablyPdf(contentType: string | null, url: string) {
	const ct = (contentType || '').toLowerCase();
	if (ct.includes('application/pdf')) return true;
	return /\.pdf($|\?)/i.test(url);
}

function isTextualContentType(ct: string | null) {
	const c = (ct || '').toLowerCase();
	return (
		c.startsWith('text/') ||
		c.includes('application/json') ||
		c.includes('application/xml') ||
		c.includes('application/xhtml')
	);
}

function stripHtml(html: string) {
	try {
		const noScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
		const noStyles = noScripts.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
		const text = noStyles.replace(/<[^>]+>/g, ' ');
		return text.replace(/\s+/g, ' ').trim();
	} catch {
		return html;
	}
}

async function fetchAndExtractTextFromUrl(fileUrl: string): Promise<string> {
	const res = await fetchRemote(fileUrl);
	const contentType = res.headers.get('content-type');
	const contentLength = Number(res.headers.get('content-length') || 0);
	if (contentLength && contentLength > MAX_REMOTE_MB * 1024 * 1024) {
		throw new CustomError(
			`Remote file too large (${bytesToMB(contentLength)} MB). Max ${MAX_REMOTE_MB} MB.`,
			413
		);
	}

	if (isProbablyPdf(contentType, fileUrl)) {
		const ab = await res.arrayBuffer();
		const buf = Buffer.from(ab);
		if (buf.byteLength > MAX_REMOTE_MB * 1024 * 1024) {
			throw new CustomError(
				`Remote PDF too large (${bytesToMB(buf.byteLength)} MB). Max ${MAX_REMOTE_MB} MB.`,
				413
			);
		}
		try {
			// Try pdf-parse first
			try {
				const parsed = await parsePdfBuffer(buf);
				const text = parsed.text?.trim();
				if (text) return text;
			} catch (inner) {
				// eslint-disable-next-line no-console
				console.warn('[fetchAndExtractTextFromUrl] pdf-parse fallback failed:', (inner as any)?.message || inner);
			}
			// Then try pdfjs-dist
			const text2 = await extractPdfTextWithPdfjs(buf);
			if (!text2) throw new CustomError('No extractable text found in PDF', 422);
			return text2;
		} catch (e: any) {
			// eslint-disable-next-line no-console
			console.error('[fetchAndExtractTextFromUrl] pdf extraction failed:', e?.message || e);
			throw new CustomError('Failed to read PDF from URL. Please try another file.', 422);
		}
	}

	if (isTextualContentType(contentType)) {
		const text = await res.text();
		if ((text?.length || 0) > MAX_REMOTE_MB * 1024 * 1024) {
			// If the server didn’t send content-length, enforce on actual size
			throw new CustomError(
				`Remote text too large (> ${MAX_REMOTE_MB} MB). Please provide a smaller file.`,
				413
			);
		}
		// If HTML, strip tags to plain text
		if ((contentType || '').toLowerCase().includes('text/html')) {
			return stripHtml(text);
		}
		return text;
	}

	throw new CustomError(
		`Unsupported content-type for URL: ${contentType || 'unknown'}. Only PDF and text content are supported.`,
		415
	);
}

// --- Exported AI Functions ---
export async function chatCompletion(messages: Array<{ role: "user" | "assistant"; content: string }>) {
	const prompt = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
	const client = getClient();
	try {
		return await runWithModelFallback(MODEL_CHAT, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt + "\nAssistant:");
			return res.response.text();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[chatCompletion] generateContent failed:", e?.message || e);
		throw toCustomAIError(e, "Chat generation failed.");
	}
}

export async function chatCompletionStream(prompt: string, onChunk: (delta: string) => void) {
	const client = getClient();
	try {
		await runWithModelFallback(MODEL_CHAT, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const stream = await model.generateContentStream(prompt);
			for await (const chunk of stream.stream) {
				const t = chunk.text();
				if (t) onChunk(t);
			}
			return null;
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[chatCompletionStream] failed:", e?.message || e);
		throw toCustomAIError(e, "Chat stream failed.");
	}
}

export async function summarizePdfBuffer(file: Express.Multer.File) {
	const mimetype = file.mimetype || "";
	if (!mimetype.includes("pdf")) {
		throw new CustomError("Only PDF summarization is supported in this endpoint.", 400);
	}
	// Preferred path: use Files API for higher fidelity
	const filesSummary = await summarizeViaFilesAPI(
		file.buffer,
		mimetype,
		file.originalname || "uploaded.pdf",
		"You are a helpful study assistant. Summarize this PDF with headings, bullet points, core concepts, definitions, and examples."
	);
	if (filesSummary) return filesSummary;

	let extractedText: string | null = null;
	let extractionError: unknown = null;

	try {
		const parsed = await parsePdfBuffer(file.buffer);
		const text = parsed.text?.trim();
		if (text) extractedText = text;
	} catch (inner) {
		extractionError = inner;
		// eslint-disable-next-line no-console
		console.warn('[summarizePdfBuffer] pdf-parse fallback failed:', (inner as any)?.message || inner);
	}

	if (!extractedText) {
		try {
			const text2 = await extractPdfTextWithPdfjs(file.buffer);
			if (text2) {
				extractedText = text2;
			}
		} catch (inner) {
			if (!extractionError) extractionError = inner;
			// eslint-disable-next-line no-console
			console.warn('[summarizePdfBuffer] pdfjs-dist fallback failed:', (inner as any)?.message || inner);
		}
	}

	if (!extractedText) {
		// eslint-disable-next-line no-console
		console.error("[summarizePdfBuffer] PDF extraction failed:", (extractionError as any)?.message || extractionError);
		throw new CustomError("Failed to read PDF. Please try another file.", 422);
	}

	return await summarizeText(extractedText);
}

export async function summarizeText(text: string) {
	const client = getClient();
	const prompt = `You are a helpful study assistant. Summarize the content with headings, bullet points, core concepts, definitions, and examples.\n\nCONTENT:\n${text}`;
	try {
		return await runWithModelFallback(MODEL_REASON, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			return res.response.text();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[summarizeText] model.generateContent failed:", e?.message || e);
		throw toCustomAIError(e, "AI summarization failed. Check API key and model configuration.");
	}
}

export async function generateFlashcardsLLM(sourceText: string, subject = "General", count = 5) {
	const client = getClient();
	const prompt = `Create ${count} study flashcards from the content. Output ONLY valid JSON array like: [{"front":"...","back":"...","subject":"${subject}","difficulty":"easy"|"medium"|"hard"}, ...]. No prose outside JSON.\n\nCONTENT:\n${sourceText}`;
	let txt = "";
	try {
		txt = await runWithModelFallback(MODEL_CHAT, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			return res.response.text().trim();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[generateFlashcardsLLM] failed:", e?.message || e);
		throw toCustomAIError(e, "Flashcard generation failed.");
	}
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
	const prompt = `Produce ${style} study notes for subject '${subject}'. Return ONLY JSON object: {"title": string, "content": string, "subject": string}.\n\nCONTENT:\n${sourceText}`;
	let txt = "";
	try {
		txt = await runWithModelFallback(MODEL_REASON, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			return res.response.text().trim();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[generateNotesLLM] failed:", e?.message || e);
		throw toCustomAIError(e, "Notes generation failed.");
	}
	try {
		const json = JSON.parse(txt);
		if (json && json.title && json.content) return json;
	} catch {}
	return { title: subject, content: txt || sourceText.slice(0, 500), subject };
}

export async function generateQuizLLM(sourceText: string, subject = "General", count = 5) {
	const client = getClient();
	const prompt = `Create a ${count}-question multiple-choice quiz about '${subject}' based on the content. The output must be ONLY a valid JSON object with the strict format: {"title": string, "questions": [{"question": string, "options": string[], "answerIndex": number, "explanation": string}]}. The options array must contain exactly 4 options. The answerIndex must be the 0-based index of the correct option.\n\nCONTENT:\n${sourceText}`;
	let txt = "";
	try {
		txt = await runWithModelFallback(MODEL_REASON, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			return res.response.text().trim();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[generateQuizLLM] failed:", e?.message || e);
		throw toCustomAIError(e, "Quiz generation failed.");
	}
	try {
		// Clean up the JSON by removing markdown fences if they exist
		const cleanedTxt = txt.replace(/^```json\s*|s*```$/g, "").trim();
		const j = JSON.parse(cleanedTxt);
		// Basic validation of the expected structure
		if (j && Array.isArray(j.questions) && j.questions.every((q: any) => q.question && Array.isArray(q.options) && typeof q.answerIndex === 'number')) {
			return j;
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn("[generateQuizLLM] Failed to parse AI JSON response:", (e as any)?.message || e);
	}
	// Fallback if parsing fails or structure is wrong
	return { title: `${subject} Quiz`, questions: [] };
}

export async function explainTextLLM(sourceText: string, question?: string) {
	const client = getClient();
	const prompt = `Explain the following${question ? ` in context of: ${question}` : ''} with clear reasoning, examples, and simplified breakdown where helpful:\n\n${sourceText}`;
	try {
		return await runWithModelFallback(MODEL_CHAT, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			return res.response.text();
		});
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[explainTextLLM] failed:", e?.message || e);
		throw toCustomAIError(e, "Explain request failed.");
	}
}

// Legacy function kept for file.controller compatibility
export const genController = async (fileUrl: string) => {
	// Attempt preferred Files API path: download as buffer and upload to Gemini
	const res = await fetchRemote(fileUrl);
	const contentType = res.headers.get('content-type') || 'application/octet-stream';
	const ab = await res.arrayBuffer();
	const buf = Buffer.from(ab);
	if (buf.byteLength > MAX_REMOTE_MB * 1024 * 1024) {
		throw new CustomError(`Remote file too large (${bytesToMB(buf.byteLength)} MB). Max ${MAX_REMOTE_MB} MB.`, 413);
	}

	const filesSummary = await summarizeViaFilesAPI(
		buf,
		contentType,
		fileUrl.split('/').pop() || 'remote-file',
		'You are a helpful study assistant. Summarize this document with headings, bullet points, core concepts, definitions, and examples.'
	);
	if (filesSummary) {
		// Maintain return type compatibility (response.response in legacy code) by returning text-wrapper object
		return { text: () => filesSummary } as any;
	}

	// Fallback: extract text locally and summarize
	const text = await fetchAndExtractTextFromUrl(fileUrl);
	const client = getClient();
	const prompt = `You are a helpful study assistant. Analyze the following file content and produce a concise, well-structured summary with headings, key points, definitions, and examples where appropriate.\n\nCONTENT:\n${text}`;
	try {
		const response = await runWithModelFallback(MODEL_REASON, async modelName => {
			const model = client.getGenerativeModel({ model: modelName });
			const res = await model.generateContent(prompt);
			// The original code was returning response.response from the older SDK style. We emulate this with the new SDK result
			return { candidates: [{ content: { parts: [{ text: res.response.text() }] } }] } as any;
		});
		return response;
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error("[genController] failed:", e?.message || e);
		throw toCustomAIError(e, "File analysis failed.");
	}
};
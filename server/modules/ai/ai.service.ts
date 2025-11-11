
import { GoogleGenAI } from "@google/genai";

export const genController = async (fileUrl: string) => {
 
  const ai = new GoogleGenAI({apiKey: process.env.GENAI_API_KEY});
  
  
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the file located at ${fileUrl} and produce a high-quality, well-structured summary.

Requirements:
- Do NOT ask questions or start a conversation.
- Automatically detect the file type (code, text, document, notes, JSON, logs, etc.).
- Extract and explain the most important concepts, not just surface details.
- Explain the purpose, structure, and meaning of the content.
- Include short examples when helpful for understanding.
- If the file is code: explain what it does, how it works, and note major issues or improvements.
- If the file is text: summarize key ideas, arguments, conclusions, and insights.
- If the file is technical: simplify complex ideas while keeping accuracy.
- Write clearly, slowly, and logically — no rushing.
- Use headings and bullet points for readability.

Output:
A clean, organized, deeply informative summary.
`,
  });
  
    return response;
};

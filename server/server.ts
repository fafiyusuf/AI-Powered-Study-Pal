import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;

if (!process.env.GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn("[AI Notice] GENAI_API_KEY/GEMINI_API_KEY not set. AI endpoints will return 500 until configured.");
}

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

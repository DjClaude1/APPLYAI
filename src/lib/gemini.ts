import { GoogleGenAI, Type } from "@google/genai";

// In Vite, process.env might not be defined in the browser.
// The platform usually shims it, but we'll be safe.
const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY;
  } catch (e) {
    return undefined;
  }
};

const GEMINI_API_KEY = getApiKey();

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

export async function generateAIContent(prompt: string, options: { 
  systemInstruction?: string, 
  jsonMode?: boolean,
  useSearch?: boolean,
  responseSchema?: any,
  inlineData?: {
    data: string;
    mimeType: string;
  }
} = {}) {
  const { systemInstruction, jsonMode, responseSchema, inlineData } = options;

  // For multi-modal (inlineData), we still use Gemini directly on client if possible
  // because it's more efficient for large payloads.
  // But for text-only, we go through the backend to handle the OpenAI fallback.
  if (inlineData) {
    try {
      const contents: any[] = [{
        parts: [
          { text: prompt },
          { inlineData }
        ]
      }];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction,
          responseMimeType: jsonMode ? "application/json" : "text/plain",
          responseSchema: jsonMode ? responseSchema : undefined,
        },
      });

      return {
        success: true,
        text: response.text || "",
      };
    } catch (error: any) {
      console.error("Gemini Direct Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Text-only generation with fallback logic in backend
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        jsonMode,
        responseSchema
      })
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate AI content",
    };
  }
}

export function cleanJson(text: string): string {
  if (!text) return "[]";
  let cleaned = text.trim();
  if (!cleaned) return "[]";
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  return cleaned || "[]";
}

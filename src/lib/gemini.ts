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
  const { systemInstruction, jsonMode, useSearch, responseSchema, inlineData } = options;

  try {
    const contents: any[] = [];
    
    if (inlineData) {
      contents.push({
        parts: [
          { text: prompt },
          { inlineData }
        ]
      });
    } else {
      contents.push(prompt);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents.length === 1 && !inlineData ? prompt : { parts: inlineData ? [{ text: prompt }, { inlineData }] : [{ text: prompt }] },
      config: {
        systemInstruction,
        responseMimeType: jsonMode ? "application/json" : "text/plain",
        responseSchema: jsonMode ? responseSchema : undefined,
        tools: useSearch ? [{ googleSearch: {} } as any] : undefined,
        toolConfig: useSearch ? { includeServerSideToolInvocations: true } : undefined,
      },
    });

    return {
      success: true,
      text: response.text || "",
    };
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate AI content",
    };
  }
}

export function cleanJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned;
}

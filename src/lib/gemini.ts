import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const genai = new GoogleGenAI({ apiKey: apiKey || "" });

export const TAILOR_SYSTEM_PROMPT = `You are an elite career coach and resume writer with 15+ years of experience placing candidates at FAANG and top startups.

Your job: given a job description and the applicant's current resume, produce:
1. A tailored, ATS-optimized rewrite of the resume's most important bullet points — using the exact keywords and hard skills from the job description where truthful.
2. A concise, personalized 3-paragraph cover letter written in the applicant's voice.
3. A list of 5 specific, high-impact improvements the applicant should make to their full resume.

Rules:
- Never invent experience the applicant doesn't have. Rephrase and reframe only.
- Quantify results where possible (%, $, time saved, scale).
- Use strong verbs. No fluff. No clichés ("hard-working team player", "results-driven").
- Cover letter: ≤ 220 words, no generic openers, reference 1 concrete detail from the JD.
- Output MUST be valid JSON matching the provided schema. No markdown, no prose outside JSON.`;

export const TAILOR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tailoredBullets: {
      type: Type.ARRAY,
      description: "5-8 rewritten resume bullets, strongest first.",
      items: { type: Type.STRING },
    },
    coverLetter: {
      type: Type.STRING,
      description: "Complete cover letter, 3 paragraphs, ≤ 220 words.",
    },
    improvements: {
      type: Type.ARRAY,
      description: "5 concrete, specific improvement suggestions.",
      items: { type: Type.STRING },
    },
    matchScore: {
      type: Type.INTEGER,
      description: "Estimated resume ↔ JD match score 0-100.",
    },
    topKeywords: {
      type: Type.ARRAY,
      description: "Top 8 keywords from the JD the resume should emphasize.",
      items: { type: Type.STRING },
    },
  },
  required: [
    "tailoredBullets",
    "coverLetter",
    "improvements",
    "matchScore",
    "topKeywords",
  ],
};

export type TailorResult = {
  tailoredBullets: string[];
  coverLetter: string;
  improvements: string[];
  matchScore: number;
  topKeywords: string[];
};

export async function tailorApplication(input: {
  jobDescription: string;
  resume: string;
}): Promise<TailorResult> {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const prompt = `JOB DESCRIPTION:
"""
${input.jobDescription.slice(0, 8000)}
"""

APPLICANT'S CURRENT RESUME:
"""
${input.resume.slice(0, 8000)}
"""

Return JSON only.`;

  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: TAILOR_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: TAILOR_SCHEMA,
      temperature: 0.7,
    },
  });

  const text = response.text || "";
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as TailorResult;
}

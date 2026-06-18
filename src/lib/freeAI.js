import { GoogleGenAI, Type } from '@google/genai';
import AppleIntelligence from '../plugins/AppleIntelligence';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Chain of free AI models — each has separate free quota
// Apple Intelligence (unlimited) → Gemini 2.0 Flash (1,500/day) → Gemini 2.5 Flash (500/day)
export async function freeAI(prompt, { json, schema, image } = {}) {
  // Image scans can't use Apple Intelligence
  if (!image) {
    try {
      const { available } = await AppleIntelligence.checkAvailability();
      if (available) {
        const response = await AppleIntelligence.generateText({ prompt });
        if (json) {
          const match = response.text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("No JSON in Apple response");
          const parsed = JSON.parse(match[0]);
          if (schema) {
            const required = schema.required || [];
            for (const key of required) {
              if (!parsed[key]) throw new Error(`Missing field: ${key}`);
            }
          }
          return { type: 'json', data: parsed };
        }
        return { type: 'text', data: response.text };
      }
    } catch (e) {
      console.log("Apple AI failed:", e.message);
    }
  }

  // Gemini fallback chain — try each model's free quota
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const contents = image ? [prompt, { inlineData: image }] : prompt;
      const config = json && schema ? {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, ...schema },
      } : {};
      const response = await ai.models.generateContent({ model, contents, config });
      if (json) {
        return { type: 'json', data: JSON.parse(response.text()) };
      }
      return { type: 'text', data: response.text() };
    } catch (e) {
      console.log(`${model} failed:`, e.message);
    }
  }
  throw new Error("All free AI models exhausted");
}

export { Type };

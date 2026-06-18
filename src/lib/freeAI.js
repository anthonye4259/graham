import { GoogleGenAI, Type } from '@google/genai';
import AppleIntelligence from '../plugins/AppleIntelligence';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// OpenAI-compatible API call (works with Groq, Cerebras, OpenRouter, etc.)
async function callOpenAICompatible(url, apiKey, model, prompt, json) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!response.ok) throw new Error(`${model}: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// Chain of ALL free AI models — each has separate free quota
// 1. Apple Intelligence (unlimited, on-device)
// 2. Gemini 2.0 Flash (1,500/day free)
// 3. Gemini 2.5 Flash (500/day free, separate quota)
// 4. Groq Llama (free tier, ~6,000 tokens/min)
// 5. Cerebras Llama (free tier, ultra fast)
export async function freeAI(prompt, { json, schema, image } = {}) {

  // === 1. Apple Intelligence (unlimited, free, on-device) ===
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
            for (const key of (schema.required || [])) {
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

  // === 2-3. Gemini chain (each model = separate free quota) ===
  const geminiModels = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of geminiModels) {
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

  // === 4. Groq — free tier (Llama 3.3 70B) ===
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  if (groqKey && !image) {
    try {
      const text = await callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        groqKey, 'llama-3.3-70b-versatile', prompt, json
      );
      if (json) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON from Groq");
        const parsed = JSON.parse(match[0]);
        if (schema) {
          for (const key of (schema.required || [])) {
            if (!parsed[key]) throw new Error(`Missing field: ${key}`);
          }
        }
        return { type: 'json', data: parsed };
      }
      return { type: 'text', data: text };
    } catch (e) {
      console.log("Groq failed:", e.message);
    }
  }

  // === 5. Cerebras — free tier (Llama 3.3 70B, ultra fast) ===
  const cerebrasKey = import.meta.env.VITE_CEREBRAS_API_KEY;
  if (cerebrasKey && !image) {
    try {
      const text = await callOpenAICompatible(
        'https://api.cerebras.ai/v1/chat/completions',
        cerebrasKey, 'llama-3.3-70b', prompt, json
      );
      if (json) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON from Cerebras");
        const parsed = JSON.parse(match[0]);
        if (schema) {
          for (const key of (schema.required || [])) {
            if (!parsed[key]) throw new Error(`Missing field: ${key}`);
          }
        }
        return { type: 'json', data: parsed };
      }
      return { type: 'text', data: text };
    } catch (e) {
      console.log("Cerebras failed:", e.message);
    }
  }

  throw new Error("All free AI models exhausted");
}

export { Type };

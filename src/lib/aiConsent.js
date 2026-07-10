export const AI_CONSENT_VERSION = '2026-07-10-external-ai-v1';
export const AI_CONSENT_KEY = 'graham_ai_consent';
export const AI_CONSENT_VERSION_KEY = 'graham_ai_consent_version';
export const AI_CONSENT_ACCEPTED_AT_KEY = 'graham_ai_consent_accepted_at';

export function hasAIConsent() {
  return (
    localStorage.getItem(AI_CONSENT_KEY) === 'true' &&
    localStorage.getItem(AI_CONSENT_VERSION_KEY) === AI_CONSENT_VERSION
  );
}

export function acceptAIConsent() {
  localStorage.setItem(AI_CONSENT_KEY, 'true');
  localStorage.setItem(AI_CONSENT_VERSION_KEY, AI_CONSENT_VERSION);
  localStorage.setItem(AI_CONSENT_ACCEPTED_AT_KEY, new Date().toISOString());
}

export function revokeAIConsent() {
  localStorage.removeItem(AI_CONSENT_KEY);
  localStorage.removeItem(AI_CONSENT_VERSION_KEY);
  localStorage.removeItem(AI_CONSENT_ACCEPTED_AT_KEY);
}

export function requireAIConsent() {
  if (!hasAIConsent()) {
    throw new Error('AI data sharing consent is required before using external AI services.');
  }
}

export const AI_DISCLOSURE_TEXT = `Graham uses external AI services to analyze markets, answer investing questions, and generate research.

Primary AI provider:
- Google's Gemini API, operated by Google LLC

Backup AI providers may be used only if the primary provider is unavailable:
- Groq, Inc.
- Cerebras Systems Inc.

When you use AI features, the following data may be sent for processing:
- Your investing questions and stock or crypto queries
- Uploaded images, such as portfolio screenshots or charts
- Relevant conversation context from the active analysis session
- Your selected investing persona and onboarding preferences

This data is used only to generate AI-powered educational market analysis. Graham does not sell your personal data.`;

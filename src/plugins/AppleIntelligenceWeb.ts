import { WebPlugin } from '@capacitor/core';
import type { AppleIntelligencePlugin } from './AppleIntelligence';

export class AppleIntelligenceWeb extends WebPlugin implements AppleIntelligencePlugin {
  async checkAvailability(): Promise<{ available: boolean }> {
    // Apple Intelligence is not available on the web.
    return { available: false };
  }

  async generateText(options: { prompt: string; model?: string }): Promise<{ text: string }> {
    throw new Error('Apple Intelligence is not available on the web. Please use a fallback cloud API.');
  }
}

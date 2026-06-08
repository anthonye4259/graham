import { registerPlugin } from '@capacitor/core';

export interface AppleIntelligencePlugin {
  /**
   * Checks if Apple Intelligence is available on the current device.
   * Returns true if running on an eligible iOS 18+ / macOS 15+ device.
   */
  checkAvailability(): Promise<{ available: boolean }>;

  /**
   * Sends a prompt to the Apple Foundation Model.
   * @param options.prompt The text prompt to send
   * @param options.model The model identifier to use (e.g., 'afm-3-cloud-pro' or 'afm-3-core')
   */
  generateText(options: { prompt: string; model?: string }): Promise<{ text: string }>;
}

const AppleIntelligence = registerPlugin<AppleIntelligencePlugin>('AppleIntelligence', {
  web: () => import('./AppleIntelligenceWeb').then(m => new m.AppleIntelligenceWeb()),
});

export default AppleIntelligence;

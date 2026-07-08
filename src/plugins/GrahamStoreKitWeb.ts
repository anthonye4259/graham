import { WebPlugin } from '@capacitor/core';
import type { GrahamStoreKitPlugin, GrahamStoreKitProduct } from './GrahamStoreKit';

export class GrahamStoreKitWeb extends WebPlugin implements GrahamStoreKitPlugin {
  async products(): Promise<{ products: GrahamStoreKitProduct[] }> {
    throw new Error('Apple in-app purchases are only available in the iOS app.');
  }

  async purchase(): Promise<{ purchased: boolean }> {
    throw new Error('Apple in-app purchases are only available in the iOS app.');
  }

  async restore(): Promise<{ restored: boolean; productIdentifiers: string[] }> {
    throw new Error('Apple in-app purchases are only available in the iOS app.');
  }
}

import { registerPlugin } from '@capacitor/core';

export interface GrahamStoreKitProduct {
  id: string;
  displayName?: string;
  description?: string;
  displayPrice?: string;
  price?: string;
}

export interface GrahamStoreKitPlugin {
  products(options: { productIdentifiers: string[] }): Promise<{ products: GrahamStoreKitProduct[] }>;
  purchaseLegacy(options: { productIdentifier: string }): Promise<{
    purchased: boolean;
    pending?: boolean;
    productIdentifier?: string;
    transactionId?: string;
  }>;
  purchase(options: { productIdentifier: string }): Promise<{
    purchased: boolean;
    pending?: boolean;
    productIdentifier?: string;
    transactionId?: string;
  }>;
  restore(options: { productIdentifiers?: string[] }): Promise<{
    restored: boolean;
    productIdentifiers: string[];
  }>;
}

const GrahamStoreKit = registerPlugin<GrahamStoreKitPlugin>('GrahamStoreKit', {
  web: () => import('./GrahamStoreKitWeb').then(m => new m.GrahamStoreKitWeb()),
});

export default GrahamStoreKit;

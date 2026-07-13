import { Capacitor } from '@capacitor/core';

const CONFIGURATION_TIMEOUT_MS = 8000;
const IDENTITY_TIMEOUT_MS = 5000;

let purchasesModulePromise;
let configurationPromise;
let isConfigured = false;
let activeUserId = null;

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function getRevenueCatAppleKey() {
  const key = import.meta.env.VITE_REVENUECAT_APPLE_KEY || import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
  return key && key !== 'appl_REPLACE_ME_WHEN_READY' ? key : '';
}

async function loadPurchases() {
  if (!Capacitor.isNativePlatform()) return null;

  if (!purchasesModulePromise) {
    purchasesModulePromise = import('@revenuecat/purchases-capacitor')
      // Keep the Capacitor proxy inside a plain object so Promise resolution
      // never probes the proxy for a non-existent `then` native method.
      .then(module => ({ plugin: module.Purchases }))
      .catch(error => {
        purchasesModulePromise = null;
        console.warn('Purchases not available:', error.message);
        return null;
      });
  }

  return await purchasesModulePromise;
}

export async function ensurePurchasesConfigured(userId) {
  const Purchases = (await loadPurchases())?.plugin;
  if (!Purchases) throw new Error('RevenueCat purchase system is not available in this build.');

  const apiKey = getRevenueCatAppleKey();
  if (!apiKey) throw new Error('RevenueCat API key is missing.');

  if (!isConfigured) {
    if (!configurationPromise) {
      configurationPromise = (async () => {
        const status = await withTimeout(
          Purchases.isConfigured(),
          CONFIGURATION_TIMEOUT_MS,
          'Purchase setup'
        );
        if (!status?.isConfigured) {
          await withTimeout(
            Purchases.configure({ apiKey, appUserID: userId || undefined }),
            CONFIGURATION_TIMEOUT_MS,
            'Purchase setup'
          );
        }
        isConfigured = true;
      })().finally(() => {
        configurationPromise = null;
      });
    }

    await configurationPromise;
  }

  if (userId && activeUserId !== userId) {
    const current = await withTimeout(
      Purchases.getAppUserID(),
      IDENTITY_TIMEOUT_MS,
      'Purchase account check'
    );
    if (current?.appUserID !== userId) {
      await withTimeout(
        Purchases.logIn({ appUserID: userId }),
        IDENTITY_TIMEOUT_MS,
        'Purchase account setup'
      );
    }
    activeUserId = userId;
  }

  return { plugin: Purchases };
}

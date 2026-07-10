import { Capacitor } from '@capacitor/core';

let initialized = false;

export async function initializeLiveUpdates(appName = 'App') {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

    // Call this immediately so a valid OTA bundle is marked healthy.
    // If a future bundle fails before this point, Capgo rolls back.
    await CapacitorUpdater.notifyAppReady();

    await Promise.allSettled([
      CapacitorUpdater.addListener('updateAvailable', event => {
        console.info(`[${appName}] OTA update available`, event);
      }),
      CapacitorUpdater.addListener('downloadComplete', event => {
        console.info(`[${appName}] OTA update downloaded`, event);
      }),
      CapacitorUpdater.addListener('downloadFailed', event => {
        console.warn(`[${appName}] OTA update download failed`, event);
      }),
      CapacitorUpdater.addListener('updateFailed', event => {
        console.warn(`[${appName}] OTA update failed and should roll back`, event);
      }),
      CapacitorUpdater.addListener('appReady', event => {
        console.info(`[${appName}] OTA bundle marked ready`, event);
      }),
    ]);
  } catch (error) {
    console.warn(`[${appName}] Live updates unavailable`, error);
  }
}

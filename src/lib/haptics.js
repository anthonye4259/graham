import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

async function getHaptics() {
  if (!isNative) return null;
  try {
    const m = await import('@capacitor/haptics');
    return m.Haptics;
  } catch (e) {
    return null;
  }
}

// Map styles locally so we don't need top-level imports
const ImpactStyleLight = 'LIGHT';
const ImpactStyleMedium = 'MEDIUM';
const ImpactStyleHeavy = 'HEAVY';
const NotificationTypeSuccess = 'SUCCESS';
const NotificationTypeError = 'ERROR';
const NotificationTypeWarning = 'WARNING';

export const hapticImpactLight = async () => {
  const H = await getHaptics();
  if (H) try { await H.impact({ style: ImpactStyleLight }); } catch (e) {}
};

export const hapticImpactMedium = async () => {
  const H = await getHaptics();
  if (H) try { await H.impact({ style: ImpactStyleMedium }); } catch (e) {}
};

export const hapticImpactHeavy = async () => {
  const H = await getHaptics();
  if (H) try { await H.impact({ style: ImpactStyleHeavy }); } catch (e) {}
};

export const hapticSelection = async () => {
  const H = await getHaptics();
  if (H) try { await H.selectionStart(); await H.selectionChanged(); await H.selectionEnd(); } catch (e) {}
};

export const hapticSuccess = async () => {
  const H = await getHaptics();
  if (H) try { await H.notification({ type: NotificationTypeSuccess }); } catch (e) {}
};

export const hapticError = async () => {
  const H = await getHaptics();
  if (H) try { await H.notification({ type: NotificationTypeError }); } catch (e) {}
};

export const hapticWarning = async () => {
  const H = await getHaptics();
  if (H) try { await H.notification({ type: NotificationTypeWarning }); } catch (e) {}
};

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const hapticImpactLight = async () => {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
};

export const hapticImpactMedium = async () => {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) {}
};

export const hapticImpactHeavy = async () => {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch (e) {}
};

export const hapticSelection = async () => {
  if (!isNative) return;
  try { await Haptics.selectionStart(); await Haptics.selectionChanged(); await Haptics.selectionEnd(); } catch (e) {}
};

export const hapticSuccess = async () => {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Success }); } catch (e) {}
};

export const hapticError = async () => {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Error }); } catch (e) {}
};

export const hapticWarning = async () => {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Warning }); } catch (e) {}
};

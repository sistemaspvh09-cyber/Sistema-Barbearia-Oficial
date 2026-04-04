/**
 * InfinitePay integration — opens the InfinitePay app via deep link.
 *
 * InfiniteTap does not support pre-filled amount via external deep link.
 * We open the app and display the amount on screen so the barber can enter it.
 *
 * iOS scheme:   infinitepay://
 * Android:      intent://infinitepay.io#Intent;scheme=https;package=io.infinitepay.android;end
 * Fallback:     App Store / Play Store
 */

export interface InfiniteTapParams {
  amount: number;     // Value in BRL (R$)
  referenceId: string;
}

const IOS_SCHEME   = 'infinitepay://';
const ANDROID_INTENT = 'intent://infinitepay.io#Intent;scheme=https;package=io.infinitepay.android;end';
const IOS_STORE    = 'https://apps.apple.com/br/app/infinitepay/id1437927113';
const ANDROID_STORE = 'https://play.google.com/store/apps/details?id=io.infinitepay.android';

function isAndroid() { return /Android/i.test(navigator.userAgent); }
function isIOS()     { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

/**
 * Tries to open the InfinitePay app.
 * Falls back to the store after 2 s if the app is not installed.
 */
export const triggerTapToPay = (_params: InfiniteTapParams): boolean => {
  if (!isIOS() && !isAndroid()) {
    // Desktop — nothing to open
    return false;
  }

  const storeUrl = isIOS() ? IOS_STORE : ANDROID_STORE;
  const appUrl   = isIOS() ? IOS_SCHEME : ANDROID_INTENT;

  // Attempt to open the app; if it doesn't respond, redirect to store
  const start = Date.now();
  window.location.href = appUrl;

  setTimeout(() => {
    // If user is still on the page (app didn't open), go to store
    if (Date.now() - start < 2500) {
      window.location.href = storeUrl;
    }
  }, 2000);

  return true;
};

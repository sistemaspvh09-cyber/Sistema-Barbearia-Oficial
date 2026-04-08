export const APP_DATA_CHANGED_EVENT = 'barberpro:data-changed';

export function emitAppDataChanged(detail?: string) {
  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED_EVENT, { detail }));
}

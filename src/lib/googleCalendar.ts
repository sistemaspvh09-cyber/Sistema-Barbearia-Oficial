/**
 * Google Calendar integration — URL-based (no OAuth, no API key required).
 *
 * Opens a pre-filled Google Calendar event in a new tab.
 * The user is already signed into Google, they just click "Save".
 *
 * Optionally, auto-open can be toggled on/off via localStorage.
 */

const AUTO_OPEN_KEY = 'gcal_auto_open';

// ─── Settings ────────────────────────────────────────────────────────────────

export function isAutoOpenEnabled(): boolean {
  return localStorage.getItem(AUTO_OPEN_KEY) !== 'false'; // default: enabled
}

export function setAutoOpen(enabled: boolean) {
  localStorage.setItem(AUTO_OPEN_KEY, String(enabled));
}

// ─── Calendar URL builder ─────────────────────────────────────────────────────

export interface AppointmentEvent {
  title: string;
  clientName: string;
  barberName: string;
  service: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  location?: string;
}

function toGCalDate(iso: string): string {
  // Convert ISO → YYYYMMDDTHHmmss (local time stripped of tz/millis)
  return iso.replace(/[-:]/g, '').split('.')[0].replace('Z', '');
}

export function buildCalendarUrl(appointment: AppointmentEvent): string {
  const start = toGCalDate(appointment.startDateTime);
  const end   = toGCalDate(appointment.endDateTime);

  const text    = `✂️ ${appointment.service} — ${appointment.clientName}`;
  const details = `Barbeiro: ${appointment.barberName}\nCliente: ${appointment.clientName}\nServiço: ${appointment.service}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${start}/${end}`,
    details,
    ...(appointment.location ? { location: appointment.location } : {}),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens a pre-filled Google Calendar event in a new tab.
 * Returns true if the tab was opened.
 */
export function createCalendarEvent(appointment: AppointmentEvent): boolean {
  const url = buildCalendarUrl(appointment);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

// ─── Legacy stubs (keep for import compatibility) ─────────────────────────────

export function isConnected(): boolean { return true; }
export function isSyncEnabled(): boolean { return isAutoOpenEnabled(); }
export function setSyncEnabled(enabled: boolean) { setAutoOpen(enabled); }
export function isClientIdConfigured(): boolean { return true; }
export async function connectGoogle(): Promise<boolean> { return true; }
export async function disconnectGoogle(): Promise<void> {}
export function getStoredToken(): string | null { return 'url-based'; }

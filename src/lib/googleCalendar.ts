/**
 * Google Calendar integration via Google Identity Services (GIS).
 *
 * Uses the Token Client (pop-up flow) — no backend needed.
 * Access tokens expire in 1h, which is acceptable for this use case.
 *
 * Setup:
 *   1. Go to https://console.cloud.google.com
 *   2. Create a project → Enable Google Calendar API
 *   3. Create OAuth 2.0 Client ID (Web Application)
 *   4. Add your Vercel URL to "Authorized JavaScript Origins"
 *   5. Set VITE_GOOGLE_CLIENT_ID in Vercel environment variables
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const TOKEN_KEY = 'gis_access_token';
const TOKEN_EXPIRY_KEY = 'gis_token_expiry';
const SYNC_ENABLED_KEY = 'gis_sync_enabled';

// ─── GIS SDK loader ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
          }) => { requestAccessToken: () => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? '0', 10);
  if (!token || Date.now() > expiry) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
}

function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isConnected(): boolean {
  return !!getStoredToken();
}

export function isSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_ENABLED_KEY) === 'true';
}

export function setSyncEnabled(enabled: boolean) {
  localStorage.setItem(SYNC_ENABLED_KEY, String(enabled));
}

export function isClientIdConfigured(): boolean {
  return !!CLIENT_ID;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function connectGoogle(): Promise<boolean> {
  if (!CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not configured.');
    return false;
  }
  await loadGisScript();

  return new Promise((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.access_token) {
          storeToken(response.access_token, response.expires_in ?? 3600);
          resolve(true);
        } else {
          console.error('Google OAuth error:', response.error);
          resolve(false);
        }
      },
    });
    client.requestAccessToken();
  });
}

export async function disconnectGoogle(): Promise<void> {
  const token = getStoredToken();
  clearToken();
  localStorage.removeItem(SYNC_ENABLED_KEY);
  if (token && window.google?.accounts) {
    await loadGisScript();
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}

// ─── Calendar API ────────────────────────────────────────────────────────────

export interface AppointmentEvent {
  title: string;
  clientName: string;
  barberName: string;
  service: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  location?: string;
}

export async function createCalendarEvent(appointment: AppointmentEvent): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  const event = {
    summary: `✂️ ${appointment.service} — ${appointment.clientName}`,
    description: `Barbeiro: ${appointment.barberName}\nCliente: ${appointment.clientName}\nServiço: ${appointment.service}`,
    location: appointment.location,
    start: { dateTime: appointment.startDateTime, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: appointment.endDateTime, timeZone: 'America/Sao_Paulo' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      // Token expired
      if (err.error?.code === 401) clearToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function syncAppointments(appointments: AppointmentEvent[]): Promise<number> {
  const token = getStoredToken();
  if (!token) return 0;

  let count = 0;
  for (const apt of appointments) {
    const ok = await createCalendarEvent(apt);
    if (ok) count++;
  }
  return count;
}

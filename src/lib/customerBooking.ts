const BOOKING_KEY = 'barberpro_customer_booking';

export interface BookingDraft {
  barbershopId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  barberId?: string | null;
  barberName?: string | null;
  date: string;
  time: string;
  scheduledAt: string;
}

export function saveBookingDraft(draft: BookingDraft) {
  localStorage.setItem(BOOKING_KEY, JSON.stringify(draft));
}

export function getBookingDraft(): BookingDraft | null {
  const raw = localStorage.getItem(BOOKING_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft() {
  localStorage.removeItem(BOOKING_KEY);
}

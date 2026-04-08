import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  resolvePublicBarbershop,
  type BarbershopRow,
  type BarberRow,
  type ServiceRow,
  type WorkingHourRow,
  type AppointmentRow,
} from '../lib/appData';

async function safeListQuery<T>(promise: PromiseLike<{ data: T[] | null; error: unknown }>) {
  const { data, error } = await promise;
  if (error) {
    console.error(error);
    return [] as T[];
  }
  return (data ?? []) as T[];
}

export function usePublicBarbershop() {
  const [barbershop, setBarbershop] = useState<BarbershopRow | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHourRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resolvedBarbershop = await resolvePublicBarbershop();
      setBarbershop(resolvedBarbershop);

      if (!resolvedBarbershop) {
        setServices([]);
        setBarbers([]);
        setWorkingHours([]);
        setAppointments([]);
        return;
      }

      const [nextServices, nextBarbers, nextWorkingHours, nextAppointments] = await Promise.all([
        safeListQuery<ServiceRow>(
          supabase
            .from('Service')
            .select('*')
            .eq('barbershopId', resolvedBarbershop.id)
            .eq('isActive', true)
            .order('sortOrder')
            .order('name'),
        ),
        safeListQuery<BarberRow>(
          supabase
            .from('Barber')
            .select('*')
            .eq('barbershopId', resolvedBarbershop.id)
            .eq('isActive', true)
            .order('createdAt'),
        ),
        safeListQuery<WorkingHourRow>(
          supabase
            .from('WorkingHours')
            .select('*')
            .eq('barbershopId', resolvedBarbershop.id)
            .order('dayOfWeek'),
        ),
        safeListQuery<AppointmentRow>(
          supabase
            .from('Appointment')
            .select('*')
            .eq('barbershopId', resolvedBarbershop.id)
            .in('status', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'])
            .order('scheduledAt'),
        ),
      ]);

      setServices(nextServices);
      setBarbers(nextBarbers);
      setWorkingHours(nextWorkingHours);
      setAppointments(nextAppointments);
    } catch (publicError) {
      const message =
        publicError instanceof Error ? publicError.message : 'Falha ao carregar a vitrine da barbearia.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    barbershop,
    services,
    barbers,
    workingHours,
    appointments,
    loading,
    error,
    refresh,
  };
}

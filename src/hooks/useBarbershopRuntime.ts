import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useBarbershopContext } from '../contexts/BarbershopContext';
import type {
  AppointmentRow,
  BarberRow,
  ClientRow,
  InternalUserRow,
  ServiceRow,
  StockItemRow,
} from '../lib/appData';
import type { Transaction } from '../services/transactionService';
import { APP_DATA_CHANGED_EVENT } from '../lib/events';

interface RuntimeState {
  users: InternalUserRow[];
  clients: ClientRow[];
  services: ServiceRow[];
  barbers: BarberRow[];
  appointments: AppointmentRow[];
  transactions: Transaction[];
  stockItems: StockItemRow[];
}

const EMPTY_STATE: RuntimeState = {
  users: [],
  clients: [],
  services: [],
  barbers: [],
  appointments: [],
  transactions: [],
  stockItems: [],
};

async function safeListQuery<T>(promise: PromiseLike<{ data: T[] | null; error: unknown }>, fallbackLabel: string) {
  const { data, error } = await promise;
  if (error) {
    console.error(`Falha ao carregar ${fallbackLabel}:`, error);
    return [] as T[];
  }
  return (data ?? []) as T[];
}

export function useBarbershopRuntime() {
  const { barbershop } = useBarbershopContext();
  const [state, setState] = useState<RuntimeState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!barbershop?.id) {
      setState(EMPTY_STATE);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [users, clients, services, barbers, appointments, transactions, stockItems] = await Promise.all([
        safeListQuery<InternalUserRow>(
          supabase.from('User').select('*').eq('barbershopId', barbershop.id).eq('isActive', true).order('name'),
          'usuarios',
        ),
        safeListQuery<ClientRow>(
          supabase.from('Client').select('*').eq('barbershopId', barbershop.id).order('name'),
          'clientes',
        ),
        safeListQuery<ServiceRow>(
          supabase.from('Service').select('*').eq('barbershopId', barbershop.id).order('sortOrder').order('name'),
          'servicos',
        ),
        safeListQuery<BarberRow>(
          supabase.from('Barber').select('*').eq('barbershopId', barbershop.id).order('createdAt'),
          'barbeiros',
        ),
        safeListQuery<AppointmentRow>(
          supabase.from('Appointment').select('*').eq('barbershopId', barbershop.id).order('scheduledAt'),
          'agendamentos',
        ),
        safeListQuery<Transaction>(
          supabase.from('Transaction').select('*').eq('barbershopId', barbershop.id).order('date', { ascending: false }),
          'transacoes',
        ),
        safeListQuery<StockItemRow>(
          supabase.from('StockItem').select('*').eq('barbershopId', barbershop.id).order('name'),
          'estoque',
        ),
      ]);

      setState({
        users,
        clients,
        services,
        barbers,
        appointments,
        transactions,
        stockItems,
      });
    } catch (runtimeError) {
      const message =
        runtimeError instanceof Error ? runtimeError.message : 'Falha ao carregar os dados da barbearia.';
      setError(message);
      setState(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, [barbershop?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const listener = () => {
      refresh();
    };

    window.addEventListener(APP_DATA_CHANGED_EVENT, listener);
    return () => window.removeEventListener(APP_DATA_CHANGED_EVENT, listener);
  }, [refresh]);

  const userById = useMemo(
    () => Object.fromEntries(state.users.map((user) => [user.id, user])),
    [state.users],
  );

  const serviceById = useMemo(
    () => Object.fromEntries(state.services.map((service) => [service.id, service])),
    [state.services],
  );

  const barberById = useMemo(
    () => Object.fromEntries(state.barbers.map((barber) => [barber.id, barber])),
    [state.barbers],
  );

  const clientById = useMemo(
    () => Object.fromEntries(state.clients.map((client) => [client.id, client])),
    [state.clients],
  );

  return {
    ...state,
    loading,
    error,
    refresh,
    userById,
    serviceById,
    barberById,
    clientById,
  };
}

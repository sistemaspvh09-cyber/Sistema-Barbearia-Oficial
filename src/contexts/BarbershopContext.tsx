import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  createBarbershopForUser,
  fetchBarberByUserId,
  fetchBarbershop,
  fetchClientForUser,
  getOrCreateInternalUser,
  normalizeRole,
  type AppRole,
  type BarberRow,
  type BarbershopRow,
  type ClientRow,
  type InternalUserRow,
  type SetupBarbershopInput,
} from '../lib/appData';

interface BarbershopContextValue {
  internalUser: InternalUserRow | null;
  barbershop: BarbershopRow | null;
  barberProfile: BarberRow | null;
  clientProfile: ClientRow | null;
  role: AppRole | null;
  loading: boolean;
  error: string | null;
  needsBarbershopSetup: boolean;
  refresh: () => Promise<void>;
  setupBarbershop: (input: SetupBarbershopInput) => Promise<void>;
}

const BarbershopContext = createContext<BarbershopContextValue | undefined>(undefined);

export function BarbershopProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [internalUser, setInternalUser] = useState<InternalUserRow | null>(null);
  const [barbershop, setBarbershop] = useState<BarbershopRow | null>(null);
  const [barberProfile, setBarberProfile] = useState<BarberRow | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = async () => {
    if (!session || !user) {
      setInternalUser(null);
      setBarbershop(null);
      setBarberProfile(null);
      setClientProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextInternalUser = await getOrCreateInternalUser(user);
      setInternalUser(nextInternalUser);

      const [nextBarbershop, nextBarberProfile, nextClientProfile] = await Promise.all([
        nextInternalUser.barbershopId ? fetchBarbershop(nextInternalUser.barbershopId) : Promise.resolve(null),
        fetchBarberByUserId(nextInternalUser.id),
        fetchClientForUser(nextInternalUser.id),
      ]);

      setBarbershop(nextBarbershop);
      setBarberProfile(nextBarberProfile);
      setClientProfile(nextClientProfile);
    } catch (contextError) {
      const message =
        contextError instanceof Error ? contextError.message : 'Falha ao carregar o contexto da barbearia.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, user?.id]);

  const setupBarbershop = async (input: SetupBarbershopInput) => {
    if (!internalUser) {
      throw new Error('Usuario interno nao carregado.');
    }

    setLoading(true);
    setError(null);

    try {
      await createBarbershopForUser(internalUser, input);
      await loadContext();
    } catch (setupError) {
      const message =
        setupError instanceof Error ? setupError.message : 'Nao foi possivel concluir a configuracao inicial.';
      setError(message);
      setLoading(false);
      throw setupError;
    }
  };

  const role = useMemo<AppRole | null>(() => {
    if (internalUser?.role) {
      return internalUser.role;
    }

    if (user) {
      return normalizeRole(user.user_metadata?.role);
    }

    return null;
  }, [internalUser?.role, user]);

  const needsBarbershopSetup = Boolean(
    session &&
      role &&
      role !== 'client' &&
      internalUser &&
      !internalUser.barbershopId &&
      !loading,
  );

  return (
    <BarbershopContext.Provider
      value={{
        internalUser,
        barbershop,
        barberProfile,
        clientProfile,
        role,
        loading,
        error,
        needsBarbershopSetup,
        refresh: loadContext,
        setupBarbershop,
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershopContext() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershopContext must be used within BarbershopProvider');
  }
  return context;
}

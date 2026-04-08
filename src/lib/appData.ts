import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AppRole = 'admin' | 'barbeiro' | 'client';

export interface InternalUserRow {
  id: string;
  authId: string;
  barbershopId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: AppRole;
  avatarUrl: string | null;
  commissionRate: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarbershopRow {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  cnpj: string | null;
  instagram: string | null;
  website: string | null;
  settings: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarberRow {
  id: string;
  userId: string;
  barbershopId: string;
  specialty: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRow {
  id: string;
  userId: string | null;
  barbershopId: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisitAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRow {
  id: string;
  barbershopId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHourRow {
  id?: string;
  barbershopId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  slotDuration: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentRow {
  id: string;
  barbershopId: string;
  clientId: string | null;
  barberId: string | null;
  serviceId: string | null;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
  notes: string | null;
  paymentMethod: string | null;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

export interface StockItemRow {
  id: string;
  barbershopId: string;
  name: string;
  brand: string | null;
  sku: string | null;
  category: string | null;
  quantity: number;
  minQuantity: number;
  unit: string | null;
  costPrice: number | null;
  sellPrice: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetupBarbershopInput {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}

export function normalizeRole(value: unknown): AppRole {
  if (value === 'barbeiro' || value === 'client' || value === 'admin') {
    return value;
  }
  return 'admin';
}

export function resolveDisplayName(authUser: AuthUser): string {
  return (
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined) ||
    authUser.email?.split('@')[0] ||
    'Usuario'
  );
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function getOrCreateInternalUser(authUser: AuthUser): Promise<InternalUserRow> {
  const { data: existing, error: fetchError } = await supabase
    .from('User')
    .select('*')
    .eq('authId', authUser.id)
    .single();

  if (existing && !fetchError) {
    return existing as InternalUserRow;
  }

  const payload = {
    authId: authUser.id,
    name: resolveDisplayName(authUser),
    email: authUser.email ?? null,
    phone: (authUser.user_metadata?.phone as string | undefined) ?? null,
    role: normalizeRole(authUser.user_metadata?.role),
    avatarUrl: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
    isActive: true,
  };

  const { data, error } = await supabase
    .from('User')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Nao foi possivel criar o usuario interno.');
  }

  return data as InternalUserRow;
}

export async function fetchBarbershop(barbershopId: string): Promise<BarbershopRow | null> {
  const { data, error } = await supabase
    .from('Barbershop')
    .select('*')
    .eq('id', barbershopId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BarbershopRow;
}

export async function fetchBarberByUserId(userId: string): Promise<BarberRow | null> {
  const { data, error } = await supabase
    .from('Barber')
    .select('*')
    .eq('userId', userId)
    .eq('isActive', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BarberRow;
}

export async function fetchClientForUser(userId: string): Promise<ClientRow | null> {
  const { data, error } = await supabase
    .from('Client')
    .select('*')
    .eq('userId', userId)
    .eq('isActive', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ClientRow;
}

export async function getOrCreateClientForBarbershop(
  authUser: AuthUser,
  barbershopId: string,
): Promise<{ internalUser: InternalUserRow; client: ClientRow }> {
  const internalUser = await getOrCreateInternalUser(authUser);

  const { data: existing } = await supabase
    .from('Client')
    .select('*')
    .eq('barbershopId', barbershopId)
    .eq('userId', internalUser.id)
    .eq('isActive', true)
    .maybeSingle();

  if (existing) {
    return { internalUser, client: existing as ClientRow };
  }

  const { data, error } = await supabase
    .from('Client')
    .insert({
      barbershopId,
      userId: internalUser.id,
      name: internalUser.name,
      email: internalUser.email,
      phone: internalUser.phone,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      isActive: true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Nao foi possivel criar o perfil do cliente.');
  }

  return { internalUser, client: data as ClientRow };
}

export async function createBarbershopForUser(
  internalUser: InternalUserRow,
  input: SetupBarbershopInput,
): Promise<{ barbershop: BarbershopRow; user: InternalUserRow }> {
  const baseSlug = slugify(input.name || internalUser.name || 'barbearia');
  const slug = `${baseSlug || 'barbearia'}-${internalUser.id.slice(0, 6).toLowerCase()}`;

  const { data: barbershop, error: barbershopError } = await supabase
    .from('Barbershop')
    .insert({
      name: input.name,
      slug,
      phone: input.phone ?? internalUser.phone ?? null,
      email: input.email ?? internalUser.email ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      settings: {},
      isActive: true,
    })
    .select('*')
    .single();

  if (barbershopError || !barbershop) {
    throw barbershopError ?? new Error('Nao foi possivel criar a barbearia.');
  }

  const { data: updatedUser, error: userError } = await supabase
    .from('User')
    .update({
      barbershopId: barbershop.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', internalUser.id)
    .select('*')
    .single();

  if (userError || !updatedUser) {
    throw userError ?? new Error('Nao foi possivel vincular o usuario a barbearia.');
  }

  const defaultHours: WorkingHourRow[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    barbershopId: barbershop.id as string,
    dayOfWeek,
    openTime: '09:00',
    closeTime: '18:00',
    isOpen: dayOfWeek !== 0,
    slotDuration: 30,
  }));

  await supabase.from('WorkingHours').upsert(defaultHours, { onConflict: 'barbershopId,dayOfWeek' });

  return {
    barbershop: barbershop as BarbershopRow,
    user: updatedUser as InternalUserRow,
  };
}

export async function resolvePublicBarbershop(): Promise<BarbershopRow | null> {
  const search = new URLSearchParams(window.location.search);
  const slug = search.get('barbershop');

  if (slug) {
    const { data } = await supabase
      .from('Barbershop')
      .select('*')
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (data) {
      return data as BarbershopRow;
    }
  }

  const { data } = await supabase
    .from('Barbershop')
    .select('*')
    .eq('isActive', true)
    .order('createdAt', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as BarbershopRow | null) ?? null;
}

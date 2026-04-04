import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BarbershopData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  description: string | null;
  cnpj: string | null;
  instagram: string | null;
  website: string | null;
  settings: Record<string, unknown>;
}

export interface WorkingHour {
  id?: string;
  barbershopId: string;
  dayOfWeek: number; // 0=Dom, 1=Seg ... 6=Sab
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
  isOpen: boolean;
  slotDuration: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBarbershopSettings() {
  const { user } = useAuth();
  const [barbershop, setBarbershop] = useState<BarbershopData | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);

  // ── Fetch internal User → barbershopId ───────────────────────────────────
  const fetchBarbershopId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('User')
      .select('barbershopId')
      .eq('authId', user.id)
      .single();
    return data?.barbershopId ?? null;
  }, [user]);

  // ── Fetch barbershop data ─────────────────────────────────────────────────
  const fetchBarbershop = useCallback(async (bsId: string) => {
    const { data, error } = await supabase
      .from('Barbershop')
      .select('*')
      .eq('id', bsId)
      .single();
    if (!error && data) setBarbershop(data as BarbershopData);
  }, []);

  // ── Fetch working hours ───────────────────────────────────────────────────
  const fetchWorkingHours = useCallback(async (bsId: string) => {
    const { data } = await supabase
      .from('WorkingHours')
      .select('*')
      .eq('barbershopId', bsId)
      .order('dayOfWeek');

    if (data && data.length > 0) {
      setWorkingHours(data as WorkingHour[]);
    } else {
      // Default schedule if none exists
      const defaults: WorkingHour[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        barbershopId: bsId,
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '18:00',
        isOpen: day !== 0, // closed on Sundays by default
        slotDuration: 30,
      }));
      setWorkingHours(defaults);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchBarbershopId().then(async (bsId) => {
      if (bsId) {
        setBarbershopId(bsId);
        await Promise.all([fetchBarbershop(bsId), fetchWorkingHours(bsId)]);
      }
      setLoading(false);
    });
  }, [user, fetchBarbershopId, fetchBarbershop, fetchWorkingHours]);

  // ── Save barbershop profile ───────────────────────────────────────────────
  const saveBarbershop = useCallback(
    async (updates: Partial<BarbershopData>): Promise<boolean> => {
      if (!barbershopId) return false;
      setSaving(true);
      const { error } = await supabase
        .from('Barbershop')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', barbershopId);
      setSaving(false);
      if (!error) setBarbershop((prev) => prev ? { ...prev, ...updates } : prev);
      return !error;
    },
    [barbershopId]
  );

  // ── Save working hours ────────────────────────────────────────────────────
  const saveWorkingHours = useCallback(
    async (hours: WorkingHour[]): Promise<boolean> => {
      if (!barbershopId) return false;
      setSaving(true);
      const payload = hours.map((h) => ({ ...h, barbershopId }));
      const { error } = await supabase
        .from('WorkingHours')
        .upsert(payload, { onConflict: 'barbershopId,dayOfWeek' });
      setSaving(false);
      if (!error) setWorkingHours(hours);
      return !error;
    },
    [barbershopId]
  );

  // ── Upload logo ───────────────────────────────────────────────────────────
  const uploadLogo = useCallback(
    async (file: File): Promise<string | null> => {
      if (!barbershopId) return null;
      const ext = file.name.split('.').pop();
      const path = `logos/${barbershopId}.${ext}`;
      const { error } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      return data.publicUrl;
    },
    [barbershopId]
  );

  return {
    barbershop,
    workingHours,
    setWorkingHours,
    barbershopId,
    loading,
    saving,
    saveBarbershop,
    saveWorkingHours,
    uploadLogo,
    refetch: async () => {
      if (barbershopId) {
        await Promise.all([fetchBarbershop(barbershopId), fetchWorkingHours(barbershopId)]);
      }
    },
  };
}

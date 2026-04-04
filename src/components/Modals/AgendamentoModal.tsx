import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Scissors, Search, Loader2, Check } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNotificationToast } from '../../contexts/NotificationToastContext';
import { createCalendarEvent, isAutoOpenEnabled } from '../../lib/googleCalendar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Barber {
  id: string;
  name: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AgendamentoModal = () => {
  const { activeModal, closeModal } = useModal();
  const { user } = useAuth();
  const { showToast } = useNotificationToast();

  const [barbershopId, setBarbershopId] = useState<string | null>(null);

  // Form state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Data from DB
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isBarber = user?.user_metadata?.role === 'barbeiro';

  // Load data when modal opens
  useEffect(() => {
    if (!user || activeModal !== 'AGENDAMENTO') return;

    supabase.from('User').select('id, barbershopId').eq('authId', user.id).single().then(async ({ data: userData }) => {
      if (!userData?.barbershopId) return;
      const bsId = userData.barbershopId as string;
      setBarbershopId(bsId);

      // If barber, pre-select self
      if (isBarber) {
        const { data: barberData } = await supabase.from('Barber').select('id').eq('userId', userData.id).single();
        if (barberData) setSelectedBarberId(barberData.id as string);
      }

      // Load clients
      supabase.from('Client').select('id, userId').eq('barbershopId', bsId).eq('isActive', true).limit(100).then(async ({ data: cls }) => {
        if (!cls?.length) return;
        const { data: users } = await supabase.from('User').select('id, name, phone').in('id', cls.map((c: { userId: string }) => c.userId));
        if (users) setClients(cls.map((c: { id: string; userId: string }) => {
          const u = (users as { id: string; name: string; phone: string | null }[]).find((u) => u.id === c.userId);
          return { id: c.id, name: u?.name ?? 'Cliente', phone: u?.phone ?? null };
        }));
      });

      // Load services
      supabase.from('Service').select('id, name, price, duration').eq('barbershopId', bsId).eq('isActive', true).then(({ data: svcs }) => {
        if (svcs) setServices(svcs as Service[]);
      });

      // Load barbers (admin only)
      if (!isBarber) {
        supabase.from('Barber').select('id, userId').eq('barbershopId', bsId).eq('isActive', true).then(async ({ data: barberRows }) => {
          if (!barberRows?.length) return;
          const { data: barberUsers } = await supabase.from('User').select('id, name').in('id', barberRows.map((b: { userId: string }) => b.userId));
          if (barberUsers) setBarbers(barberRows.map((b: { id: string; userId: string }) => {
            const u = (barberUsers as { id: string; name: string }[]).find((u) => u.id === b.userId);
            return { id: b.id, name: u?.name ?? 'Barbeiro' };
          }));
        });
      }
    });
  }, [user, activeModal, isBarber]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  const handleConfirm = async () => {
    if (!barbershopId || !selectedServiceId || !date || !time) {
      showToast({ type: 'warning', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService?.duration ?? 30) * 60_000);

      const { error } = await supabase.from('Appointment').insert({
        barbershopId,
        clientId: selectedClientId || null,
        barberId: selectedBarberId || null,
        serviceId: selectedServiceId,
        scheduledAt: startDateTime.toISOString(),
        status: 'SCHEDULED',
        price: selectedService?.price ?? 0,
      });

      if (error) throw error;

      // Open Google Calendar event in new tab if auto-open is enabled
      if (isAutoOpenEnabled()) {
        const barberName = isBarber
          ? (user?.user_metadata?.full_name ?? user?.email ?? 'Barbeiro')
          : (barbers.find((b) => b.id === selectedBarberId)?.name ?? 'Barbeiro');

        await createCalendarEvent({
          title: selectedService?.name ?? 'Agendamento',
          clientName: selectedClient?.name ?? 'Cliente',
          barberName,
          service: selectedService?.name ?? '',
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        });
      }

      setSuccess(true);
      showToast({ type: 'success', title: 'Agendamento confirmado!' });
      setTimeout(() => { closeModal(); setSuccess(false); resetForm(); }, 1800);
    } catch {
      showToast({ type: 'error', title: 'Erro ao agendar', message: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setClientSearch(''); setSelectedClientId(''); setSelectedServiceId('');
    if (!isBarber) setSelectedBarberId('');
    setDate(''); setTime('');
  };

  if (activeModal !== 'AGENDAMENTO') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(200,255,0,0.1)] relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85dvh] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[rgba(200,255,0,0.02)] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8FF00]" />
            Novo Agendamento
          </h2>
          <button onClick={() => { closeModal(); resetForm(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#C8FF00]/10 flex items-center justify-center mb-4">
              <Check size={32} className="text-[#C8FF00]" />
            </div>
            <p className="text-xl font-black text-white">Agendado!</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {selectedClient?.name ?? 'Cliente'} • {time} • {selectedService?.name}
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar pb-10">
              {/* Cliente */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Buscar Cliente</label>
                <div className="relative">
                  <Search className="absolute top-3 left-4 text-on-surface-variant" size={18} />
                  <input type="text" value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); if (selectedClientId) setSelectedClientId(''); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white placeholder-white/20"
                    placeholder="Nome ou telefone do cliente..." />
                </div>
                {clientSearch && !selectedClientId && filteredClients.length > 0 && (
                  <div className="mt-1 bg-surface-container-highest border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {filteredClients.slice(0, 5).map((c) => (
                      <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm text-white"
                        onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name); }}>
                        <span className="font-semibold">{c.name}</span>
                        {c.phone && <span className="text-on-surface-variant ml-2 text-xs">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Serviço */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Serviço *</label>
                  <div className="relative">
                    <Scissors className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer">
                      <option value="">Selecione...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2).replace('.', ',')})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profissional — admin only */}
                {!isBarber && (
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Profissional</label>
                    <div className="relative">
                      <User className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                      <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer">
                        <option value="">Qualquer</option>
                        {barbers.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Data */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Data *</label>
                  <div className="relative">
                    <Calendar className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white [color-scheme:dark]" />
                  </div>
                </div>

                {/* Horário */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Horário *</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* Google Calendar indicator */}
              {isAutoOpenEnabled() && (
                <div className="flex items-center gap-2 text-xs text-[#C8FF00]/70">
                  <Calendar size={12} />
                  <span>Abrirá no Google Calendar para salvar</span>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-white/5 flex gap-4 justify-between bg-[#0a0a0a] items-center shrink-0">
              <div className="text-left hidden sm:block">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total Estimado</p>
                <p className="text-lg font-black text-[#C8FF00]">
                  {selectedService ? `R$ ${selectedService.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => { closeModal(); resetForm(); }}
                  className="px-6 py-3 font-bold text-on-surface transition-colors hover:bg-white/5 rounded-xl w-full sm:w-auto">
                  Cancelar
                </button>
                <button onClick={handleConfirm} disabled={saving || !selectedServiceId || !date || !time}
                  className="px-8 py-3 font-black text-[#4f6700] bg-[#C8FF00] hover:bg-[#b3e600] transition-colors rounded-xl neon-shadow w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Confirmar'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgendamentoModal;

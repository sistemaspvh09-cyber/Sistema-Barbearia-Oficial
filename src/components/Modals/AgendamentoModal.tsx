import { useEffect, useState } from 'react';
import { X, Calendar, Clock, User, Scissors, Search, Loader2, Check } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useBarbershopContext } from '../../contexts/BarbershopContext';
import { supabase } from '../../lib/supabase';
import { useNotificationToast } from '../../contexts/NotificationToastContext';
import { createCalendarEvent, isAutoOpenEnabled } from '../../lib/googleCalendar';
import { emitAppDataChanged } from '../../lib/events';

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

const AgendamentoModal = () => {
  const { activeModal, closeModal } = useModal();
  const { role, barbershop, barberProfile, internalUser } = useBarbershopContext();
  const { showToast } = useNotificationToast();

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isBarber = role === 'barbeiro';

  useEffect(() => {
    if (activeModal !== 'AGENDAMENTO' || !barbershop?.id) {
      return;
    }

    if (isBarber && barberProfile?.id) {
      setSelectedBarberId(barberProfile.id);
    }

    supabase
      .from('Client')
      .select('id, name, phone')
      .eq('barbershopId', barbershop.id)
      .eq('isActive', true)
      .order('name')
      .limit(100)
      .then(({ data }) => {
        setClients((data as Client[]) ?? []);
      });

    supabase
      .from('Service')
      .select('id, name, price, duration')
      .eq('barbershopId', barbershop.id)
      .eq('isActive', true)
      .order('sortOrder')
      .order('name')
      .then(({ data }) => {
        setServices((data as Service[]) ?? []);
      });

    if (!isBarber) {
      supabase
        .from('Barber')
        .select('id, userId')
        .eq('barbershopId', barbershop.id)
        .eq('isActive', true)
        .then(async ({ data: barberRows }) => {
          if (!barberRows?.length) {
            setBarbers([]);
            return;
          }

          const { data: barberUsers } = await supabase
            .from('User')
            .select('id, name')
            .in('id', barberRows.map((barber) => barber.userId));

          setBarbers(
            barberRows.map((barber) => ({
              id: barber.id as string,
              name:
                (barberUsers as { id: string; name: string }[] | null)?.find((candidate) => candidate.id === barber.userId)
                  ?.name ?? 'Barbeiro',
            })),
          );
        });
    }
  }, [activeModal, barbershop?.id, barberProfile?.id, isBarber]);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(clientSearch.toLowerCase()));

  const resetForm = () => {
    setClientSearch('');
    setSelectedClientId('');
    setSelectedServiceId('');
    setDate('');
    setTime('');
    setSaving(false);
    setSuccess(false);

    if (!isBarber) {
      setSelectedBarberId('');
    }
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleConfirm = async () => {
    if (!barbershop?.id || !selectedServiceId || !date || !time) {
      showToast({ type: 'warning', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    setSaving(true);

    try {
      const startDateTime = new Date(`${date}T${time}:00`);
      const duration = selectedService?.duration ?? 30;
      const endDateTime = new Date(startDateTime.getTime() + duration * 60_000);

      const { error } = await supabase.from('Appointment').insert({
        barbershopId: barbershop.id,
        clientId: selectedClientId || null,
        barberId: selectedBarberId || barberProfile?.id || null,
        serviceId: selectedServiceId,
        scheduledAt: startDateTime.toISOString(),
        duration,
        status: 'SCHEDULED',
        price: selectedService?.price ?? 0,
        paymentMethod: null,
        paymentStatus: 'PENDING',
      });

      if (error) {
        throw error;
      }

      emitAppDataChanged('appointment-created');

      if (isAutoOpenEnabled()) {
        const barberName = isBarber
          ? internalUser?.name ?? 'Barbeiro'
          : barbers.find((barber) => barber.id === selectedBarberId)?.name ?? 'Barbeiro';

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
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (appointmentError) {
      const message =
        appointmentError instanceof Error ? appointmentError.message : 'Tente novamente em instantes.';
      showToast({ type: 'error', title: 'Erro ao agendar', message });
      setSaving(false);
    }
  };

  if (activeModal !== 'AGENDAMENTO') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(200,255,0,0.1)] relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85dvh] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[rgba(200,255,0,0.02)] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8FF00]" />
            Novo Agendamento
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
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
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Buscar Cliente</label>
                <div className="relative">
                  <Search className="absolute top-3 left-4 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(event) => {
                      setClientSearch(event.target.value);
                      if (selectedClientId) setSelectedClientId('');
                    }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white placeholder-white/20"
                    placeholder="Nome ou telefone do cliente..."
                  />
                </div>
                {clientSearch && !selectedClientId && filteredClients.length > 0 && (
                  <div className="mt-1 bg-surface-container-highest border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {filteredClients.slice(0, 5).map((client) => (
                      <button
                        key={client.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm text-white"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientSearch(client.name);
                        }}
                      >
                        <span className="font-semibold">{client.name}</span>
                        {client.phone && <span className="text-on-surface-variant ml-2 text-xs">{client.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`grid gap-4 ${isBarber ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Serviço *</label>
                  <div className="relative">
                    <Scissors className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <select
                      value={selectedServiceId}
                      onChange={(event) => setSelectedServiceId(event.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} (R$ {service.price.toFixed(2).replace('.', ',')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!isBarber && (
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Profissional</label>
                    <div className="relative">
                      <User className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                      <select
                        value={selectedBarberId}
                        onChange={(event) => setSelectedBarberId(event.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer"
                      >
                        <option value="">Qualquer</option>
                        {barbers.map((barber) => (
                          <option key={barber.id} value={barber.id}>
                            {barber.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Data *</label>
                  <div className="relative">
                    <Calendar className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Horário *</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

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
                <button
                  onClick={handleClose}
                  className="px-6 py-3 font-bold text-on-surface transition-colors hover:bg-white/5 rounded-xl w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving || !selectedServiceId || !date || !time}
                  className="px-8 py-3 font-black text-[#4f6700] bg-[#C8FF00] hover:bg-[#b3e600] transition-colors rounded-xl neon-shadow w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
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

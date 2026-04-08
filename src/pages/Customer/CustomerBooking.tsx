import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { usePublicBarbershop } from '../../hooks/usePublicBarbershop';
import { formatCurrency, getInitials } from '../../lib/format';
import { saveBookingDraft } from '../../lib/customerBooking';
import { supabase } from '../../lib/supabase';

function nextSevenDays() {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });
}

function toTimeLabel(value: Date) {
  return value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const CustomerBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { barbershop, services, barbers, workingHours, appointments, loading, error } = usePublicBarbershop();
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('service') ?? '');
  const [selectedBarberId, setSelectedBarberId] = useState(searchParams.get('barber') ?? '');
  const [selectedDate, setSelectedDate] = useState(() => nextSevenDays()[0].toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (!selectedServiceId && services[0]?.id) {
      setSelectedServiceId(services[0].id);
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    if (!barbers.length) {
      setBarberNames({});
      return;
    }

    supabase
      .from('User')
      .select('id, name')
      .in('id', barbers.map((barber) => barber.userId))
      .then(({ data }) => {
        const nextNames = Object.fromEntries(((data ?? []) as { id: string; name: string }[]).map((user) => [user.id, user.name]));
        setBarberNames(nextNames);
      });
  }, [barbers]);

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId) ?? null;
  const displayDays = useMemo(() => nextSevenDays(), []);

  const selectedWorkingHours = useMemo(() => {
    const weekday = new Date(`${selectedDate}T12:00:00`).getDay();
    return workingHours.find((entry) => entry.dayOfWeek === weekday && entry.isOpen) ?? null;
  }, [selectedDate, workingHours]);

  const bookedSlots = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.status !== 'CANCELLED')
      .filter((appointment) => appointment.scheduledAt.slice(0, 10) === selectedDate)
      .filter((appointment) => !selectedBarberId || appointment.barberId === selectedBarberId)
      .map((appointment) => toTimeLabel(new Date(appointment.scheduledAt)));
  }, [appointments, selectedBarberId, selectedDate]);

  const availableTimes = useMemo(() => {
    if (!selectedWorkingHours) {
      return [] as string[];
    }

    const [openHour, openMinute] = selectedWorkingHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = selectedWorkingHours.closeTime.split(':').map(Number);
    const slotDuration = selectedWorkingHours.slotDuration || selectedService?.duration || 30;

    const pointer = new Date(`${selectedDate}T00:00:00`);
    pointer.setHours(openHour, openMinute, 0, 0);

    const limit = new Date(`${selectedDate}T00:00:00`);
    limit.setHours(closeHour, closeMinute, 0, 0);

    const slots: string[] = [];
    while (pointer < limit) {
      slots.push(toTimeLabel(pointer));
      pointer.setMinutes(pointer.getMinutes() + slotDuration);
    }

    return slots.filter((slot) => !bookedSlots.includes(slot));
  }, [bookedSlots, selectedDate, selectedService?.duration, selectedWorkingHours]);

  const handleContinue = () => {
    if (!barbershop?.id || !selectedService || !selectedTime) {
      return;
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    saveBookingDraft({
      barbershopId: barbershop.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.duration,
      barberId: selectedBarber?.id ?? null,
      barberName: selectedBarber ? barberNames[selectedBarber.userId] ?? 'Profissional' : null,
      date: selectedDate,
      time: selectedTime,
      scheduledAt,
    });

    navigate('/app/checkout');
  };

  return (
    <div className="flex h-full flex-col bg-[#0D0D0D]">
      <div className="flex-1 p-6">
        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-center text-on-surface-variant">Carregando agenda...</div>
        ) : error || !barbershop ? (
          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-center">
            <p className="text-sm font-bold text-white">Nao foi possivel abrir o agendamento</p>
            <p className="mt-2 text-xs text-on-surface-variant">{error || 'Nenhuma barbearia publica encontrada.'}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-4">
              <SelectionCard title="Servico" subtitle={selectedService ? `${selectedService.duration} min` : 'Escolha um servico'}>
                <select
                  value={selectedServiceId}
                  onChange={(event) => {
                    setSelectedServiceId(event.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full rounded-2xl border border-white/5 bg-surface-container px-4 py-4 text-sm text-white"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} • {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
              </SelectionCard>

              <SelectionCard title="Profissional" subtitle={selectedBarber ? 'Horarios filtrados para o profissional escolhido' : 'Opcional'}>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedBarberId('');
                      setSelectedTime('');
                    }}
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold ${selectedBarberId ? 'border-white/5 bg-surface-container text-on-surface-variant' : 'border-[#C8FF00]/30 bg-[#C8FF00]/10 text-[#C8FF00]'}`}
                  >
                    Qualquer profissional
                  </button>
                  {barbers.map((barber) => {
                    const name = barberNames[barber.userId] ?? 'Profissional';
                    return (
                      <button
                        key={barber.id}
                        onClick={() => {
                          setSelectedBarberId(barber.id);
                          setSelectedTime('');
                        }}
                        className={`flex min-w-[140px] items-center gap-3 rounded-2xl border px-4 py-3 ${
                          selectedBarberId === barber.id ? 'border-[#C8FF00]/30 bg-[#C8FF00]/10 text-[#C8FF00]' : 'border-white/5 bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-xs font-black">{getInitials(name)}</div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">{name}</p>
                          <p className="text-[10px] uppercase tracking-widest">{barber.specialty ?? 'Barbeiro'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SelectionCard>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#C8FF00]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Escolha a data</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {displayDays.map((date) => {
                  const value = date.toISOString().slice(0, 10);
                  const isSelected = selectedDate === value;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setSelectedDate(value);
                        setSelectedTime('');
                      }}
                      className={`min-w-[70px] rounded-2xl border p-3 transition-all ${
                        isSelected ? 'border-[#C8FF00] bg-[#C8FF00] text-[#4f6700]' : 'border-white/5 bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className={`block text-[10px] font-bold uppercase ${isSelected ? 'opacity-70' : ''}`}>
                        {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <span className={`block text-xl font-black ${isSelected ? '' : 'text-white'}`}>{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Clock size={16} className="text-[#C8FF00]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Horários disponíveis</h3>
              </div>

              {!selectedWorkingHours ? (
                <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
                  A barbearia está fechada nesta data.
                </div>
              ) : availableTimes.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
                  Nenhum horário livre neste dia.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                        selectedTime === time ? 'border-[#C8FF00] bg-[#C8FF00] text-[#4f6700]' : 'border-white/5 bg-surface-container text-white'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedService && (
              <div className="rounded-2xl border border-white/5 bg-surface-container p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Resumo</p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white">{selectedService.name}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {selectedBarber ? barberNames[selectedBarber.userId] ?? 'Profissional' : 'Qualquer profissional'} • {selectedService.duration} min
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#C8FF00]">{formatCurrency(selectedService.price)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-6 pt-0">
        <button
          onClick={handleContinue}
          disabled={!selectedTime || !selectedService}
          className="flex w-full items-center justify-between rounded-2xl bg-[#C8FF00] p-4 font-black text-[#4f6700] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Ir para pagamento</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const SelectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/5 bg-surface-container p-4">
    <div className="mb-3 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">{subtitle}</p>
      </div>
      <div className="rounded-full bg-white/5 p-2 text-on-surface-variant">
        <User size={14} />
      </div>
    </div>
    {children}
  </div>
);

export default CustomerBooking;

import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { useBarbershopContext } from '../contexts/BarbershopContext';

const locales = { 'pt-BR': ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Agenda = () => {
  const { openModal } = useModal();
  const { role, barberProfile } = useBarbershopContext();
  const { appointments, barbers, users, services, clients, loading, error } = useBarbershopRuntime();

  const serviceById = useMemo(() => Object.fromEntries(services.map((service) => [service.id, service])), [services]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((client) => [client.id, client])), [clients]);
  const barberById = useMemo(() => Object.fromEntries(barbers.map((barber) => [barber.id, barber])), [barbers]);
  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);

  const events = useMemo<Event[]>(() => {
    return appointments
      .filter((appointment) => role !== 'barbeiro' || appointment.barberId === barberProfile?.id)
      .filter((appointment) => appointment.status !== 'CANCELLED')
      .map((appointment) => {
        const service = appointment.serviceId ? serviceById[appointment.serviceId] : null;
        const client = appointment.clientId ? clientById[appointment.clientId] : null;
        const barber = appointment.barberId ? barberById[appointment.barberId] : null;
        const start = new Date(appointment.scheduledAt);
        const end = new Date(start.getTime() + (appointment.duration ?? 30) * 60_000);

        return {
          title: `${service?.name ?? 'Servico'} • ${client?.name ?? 'Cliente'}${role === 'barbeiro' ? '' : ` • ${barber ? userById[barber.userId]?.name ?? 'Profissional' : 'Sem profissional'}`}`,
          start,
          end,
          resource: appointment,
        };
      });
  }, [appointments, barberById, barberProfile?.id, clientById, role, serviceById, userById]);

  return (
    <div className="relative mt-6 flex h-[calc(100vh-6rem)] flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Agenda</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Calendário alimentado pelos agendamentos reais da barbearia.</p>
        </div>
      </div>

      <div className="flex-1 rounded-3xl bg-surface-container p-6 glass-border overflow-hidden custom-calendar-wrapper">
        {loading ? (
          <div className="flex h-full items-center justify-center text-on-surface-variant">Carregando agenda...</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-lg font-bold text-white">Nao foi possivel carregar a agenda</p>
              <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-lg font-bold text-white">Nenhum agendamento encontrado</p>
              <p className="mt-2 text-sm text-on-surface-variant">Crie o primeiro agendamento para começar a preencher o calendário.</p>
            </div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="pt-BR"
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              noEventsInRange: 'Nenhum agendamento neste período',
            }}
            style={{ height: '100%', color: '#fff' }}
          />
        )}
      </div>

      <button
        onClick={() => openModal('AGENDAMENTO')}
        className="fixed bottom-24 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#C8FF00] text-[#4f6700] shadow-[0_0_20px_rgba(200,255,0,0.4)] transition-all hover:scale-110 active:scale-90 lg:bottom-10 lg:right-10"
      >
        <Plus size={32} className="font-black" />
      </button>
    </div>
  );
};

export default Agenda;

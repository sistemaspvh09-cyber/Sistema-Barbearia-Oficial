import { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePublicBarbershop } from '../../hooks/usePublicBarbershop';
import { getOrCreateClientForBarbershop, type AppointmentRow } from '../../lib/appData';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDateTime } from '../../lib/format';

const CustomerHistory = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { barbershop, services, barbers, loading: publicLoading, error: publicError } = usePublicBarbershop();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setBarberNames(Object.fromEntries(((data ?? []) as { id: string; name: string }[]).map((entry) => [entry.id, entry.name])));
      });
  }, [barbers]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!session || !user || !barbershop?.id) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { client } = await getOrCreateClientForBarbershop(user, barbershop.id);
        const { data, error: appointmentsError } = await supabase
          .from('Appointment')
          .select('*')
          .eq('barbershopId', barbershop.id)
          .eq('clientId', client.id)
          .order('scheduledAt', { ascending: true });

        if (appointmentsError) {
          throw appointmentsError;
        }

        setAppointments((data ?? []) as AppointmentRow[]);
      } catch (historyError) {
        const message =
          historyError instanceof Error ? historyError.message : 'Nao foi possivel carregar seu historico.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [barbershop?.id, session, user]);

  const serviceById = useMemo(() => Object.fromEntries(services.map((service) => [service.id, service])), [services]);
  const barberById = useMemo(() => Object.fromEntries(barbers.map((barber) => [barber.id, barber])), [barbers]);

  const nextAppointment = appointments.find((appointment) => new Date(appointment.scheduledAt) >= new Date() && appointment.status !== 'CANCELLED') ?? null;
  const pastAppointments = appointments.filter((appointment) => !nextAppointment || appointment.id !== nextAppointment.id).reverse();

  if (!session) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-white/5 bg-surface-container p-6 text-center">
          <p className="text-lg font-bold text-white">Entre para ver seus horários</p>
          <p className="mt-2 text-sm text-on-surface-variant">Seu histórico e suas próximas reservas ficam vinculados ao seu perfil.</p>
          <button
            onClick={() => navigate('/app/login')}
            className="mt-6 rounded-2xl bg-[#C8FF00] px-6 py-3 font-black text-[#4f6700]"
          >
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  if (publicLoading || loading) {
    return <div className="p-6 text-center text-on-surface-variant">Carregando histórico...</div>;
  }

  if (publicError || error || !barbershop) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-bold text-white">Nao foi possivel carregar seu histórico</p>
        <p className="mt-2 text-sm text-on-surface-variant">{publicError || error || 'Barbearia não encontrada.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Seu próximo horário</h2>
        {nextAppointment ? (
          <div className="overflow-hidden rounded-3xl bg-[#C8FF00] p-5 shadow-[0_0_30px_rgba(200,255,0,0.2)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className="inline-block rounded-md bg-black/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#4f6700]">
                  {nextAppointment.status}
                </span>
                <h3 className="mt-3 text-xl font-black text-[#4f6700]">{formatDateTime(nextAppointment.scheduledAt)}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Calendar size={24} className="text-[#4f6700]" />
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <h4 className="font-black text-[#4f6700]">{serviceById[nextAppointment.serviceId ?? '']?.name ?? 'Serviço'}</h4>
              <p className="mt-1 text-xs font-bold text-[#4f6700]/80">
                com {nextAppointment.barberId ? barberNames[barberById[nextAppointment.barberId]?.userId ?? ''] ?? 'Profissional' : 'Profissional da casa'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
            Você ainda não tem um horário futuro confirmado.
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 mt-8 text-sm font-bold uppercase tracking-wider text-white">Histórico</h2>
        {pastAppointments.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
            Seu histórico aparece aqui assim que você concluir o primeiro atendimento.
          </div>
        ) : (
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-white/5 bg-surface-container p-4">
                <div className="flex justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-on-surface-variant">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{serviceById[appointment.serviceId ?? '']?.name ?? 'Serviço'}</h4>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {formatDateTime(appointment.scheduledAt)} • {appointment.barberId ? barberNames[barberById[appointment.barberId]?.userId ?? ''] ?? 'Profissional' : 'Sem profissional'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant">{formatCurrency(appointment.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-[#C8FF00]">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{barbershop.name}</h4>
            <p className="text-[11px] text-on-surface-variant">
              {[barbershop.address, barbershop.neighborhood, barbershop.city, barbershop.state].filter(Boolean).join(' • ') || 'Endereço não informado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;

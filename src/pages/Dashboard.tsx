import { useMemo } from 'react';
import { CalendarCheck, Clock3, TrendingUp, UserPlus, Wallet } from 'lucide-react';
import { useBarbershopContext } from '../contexts/BarbershopContext';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { formatCurrency, formatDateTime, formatShortDate, getInitials } from '../lib/format';

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday() {
  const value = startOfToday();
  value.setDate(value.getDate() + 1);
  return value;
}

function startOfMonth() {
  const value = new Date();
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

const statusLabel: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
};

const statusTone: Record<string, string> = {
  SCHEDULED: 'bg-white/5 text-on-surface-variant',
  CONFIRMED: 'bg-[#C8FF00]/10 text-[#C8FF00]',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-300',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300',
  CANCELLED: 'bg-red-500/10 text-red-300',
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="glass-card rounded-3xl p-8 text-center border border-white/5">
    <p className="text-lg font-bold text-white">{title}</p>
    <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
  </div>
);

const LoadingState = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-16 rounded-3xl bg-white/5" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-36 rounded-3xl bg-white/5" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-80 rounded-3xl bg-white/5 lg:col-span-2" />
      <div className="h-80 rounded-3xl bg-white/5" />
    </div>
  </div>
);

const MetricCard = ({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) => (
  <div className="glass-card rounded-3xl p-6 border border-white/5">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8FF00]/10 text-[#C8FF00]">
      {icon}
    </div>
    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    <p className="mt-2 text-xs text-on-surface-variant">{helper}</p>
  </div>
);

const TimelineList = ({
  items,
  resolveClientName,
  resolveServiceName,
  resolveBarberName,
}: {
  items: { id: string; scheduledAt: string; status: string; clientId: string | null; serviceId: string | null; barberId: string | null }[];
  resolveClientName: (clientId: string | null) => string;
  resolveServiceName: (serviceId: string | null) => string;
  resolveBarberName: (barberId: string | null) => string;
}) => (
  <div className="space-y-4">
    {items.map((item) => (
      <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-container-low p-4">
        <div className="w-16 shrink-0 text-sm font-bold text-on-surface-variant">
          {new Date(item.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{resolveClientName(item.clientId)}</p>
          <p className="text-xs text-on-surface-variant">
            {resolveServiceName(item.serviceId)} • {resolveBarberName(item.barberId)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[item.status] ?? 'bg-white/5 text-on-surface-variant'}`}>
          {statusLabel[item.status] ?? item.status}
        </span>
      </div>
    ))}
  </div>
);

const DailyRevenueBars = ({ values }: { values: { label: string; amount: number }[] }) => {
  const max = Math.max(...values.map((entry) => entry.amount), 1);

  return (
    <div className="grid h-72 grid-cols-7 gap-3">
      {values.map((entry) => {
        const height = Math.max(8, Math.round((entry.amount / max) * 100));
        return (
          <div key={entry.label} className="flex flex-col items-center justify-end gap-3">
            <span className="text-[10px] font-bold text-on-surface-variant">{entry.amount > 0 ? formatCurrency(entry.amount) : '—'}</span>
            <div className="relative flex h-full w-full items-end rounded-2xl bg-white/5 px-2 pb-2">
              <div className="w-full rounded-xl bg-[#C8FF00]" style={{ height: `${height}%` }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{entry.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const { role, barbershop, barberProfile, internalUser } = useBarbershopContext();
  const { appointments, transactions, clients, barbers, loading, error, userById, clientById, serviceById } = useBarbershopRuntime();

  const todayStart = useMemo(() => startOfToday(), []);
  const todayEnd = useMemo(() => endOfToday(), []);
  const monthStart = useMemo(() => startOfMonth(), []);
  const now = new Date();

  const resolveClientName = (clientId: string | null) => (clientId ? clientById[clientId]?.name ?? 'Cliente' : 'Cliente avulso');
  const resolveServiceName = (serviceId: string | null) => (serviceId ? serviceById[serviceId]?.name ?? 'Servico' : 'Servico avulso');
  const resolveBarberName = (barberId: string | null) => {
    const barber = barberId ? barbers.find((entry) => entry.id === barberId) : null;
    if (!barber) return 'Profissional';
    return userById[barber.userId]?.name ?? 'Profissional';
  };

  const appointmentsToday = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          const scheduledAt = new Date(appointment.scheduledAt);
          return scheduledAt >= todayStart && scheduledAt < todayEnd;
        })
        .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt)),
    [appointments, todayEnd, todayStart],
  );

  const upcomingAppointments = appointmentsToday.filter(
    (appointment) => new Date(appointment.scheduledAt) >= now && appointment.status !== 'CANCELLED',
  );

  const monthTransactions = transactions.filter(
    (transaction) =>
      transaction.type === 'INCOME' &&
      transaction.status === 'COMPLETED' &&
      new Date(transaction.date) >= monthStart,
  );

  const monthRevenue = monthTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const monthAppointments = appointments.filter(
    (appointment) => appointment.status === 'COMPLETED' && new Date(appointment.scheduledAt) >= monthStart,
  );
  const averageTicket = monthAppointments.length > 0 ? monthRevenue / monthAppointments.length : 0;

  const recentSevenDays = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(todayStart);
      date.setDate(todayStart.getDate() - (6 - index));
      return date;
    });

    return days.map((date) => {
      const label = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const amount = transactions
        .filter(
          (transaction) =>
            transaction.type === 'INCOME' &&
            transaction.status === 'COMPLETED' &&
            new Date(transaction.date) >= date &&
            new Date(transaction.date) < nextDay,
        )
        .reduce((total, transaction) => total + transaction.amount, 0);
      return { label, amount };
    });
  }, [todayStart, transactions]);

  const topBarbers = useMemo(() => {
    return barbers
      .map((barber) => {
        const relatedAppointments = appointments.filter((appointment) => appointment.barberId === barber.id && appointment.status === 'COMPLETED');
        const relatedTransactions = transactions.filter(
          (transaction) => transaction.barberId === barber.id && transaction.type === 'INCOME' && transaction.status === 'COMPLETED',
        );
        return {
          id: barber.id,
          name: userById[barber.userId]?.name ?? 'Profissional',
          completedAppointments: relatedAppointments.length,
          revenue: relatedTransactions.reduce((total, transaction) => total + transaction.amount, 0),
        };
      })
      .sort((left, right) => right.revenue - left.revenue || right.completedAppointments - left.completedAppointments)
      .slice(0, 3);
  }, [appointments, barbers, transactions, userById]);

  const barberAppointmentsToday = appointmentsToday.filter((appointment) => appointment.barberId === barberProfile?.id);
  const barberCompletedToday = barberAppointmentsToday.filter((appointment) => appointment.status === 'COMPLETED');
  const barberRevenueToday = transactions
    .filter(
      (transaction) =>
        transaction.barberId === barberProfile?.id &&
        transaction.type === 'INCOME' &&
        transaction.status === 'COMPLETED' &&
        new Date(transaction.date) >= todayStart &&
        new Date(transaction.date) < todayEnd,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const nextAppointment = (role === 'barbeiro' ? barberAppointmentsToday : upcomingAppointments)[0] ?? null;

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <EmptyState title="Nao foi possivel carregar o dashboard" description={error} />;
  }

  if (!barbershop) {
    return <EmptyState title="Nenhuma barbearia ativa" description="Crie ou selecione uma barbearia para liberar o painel operacional." />;
  }

  if (role === 'barbeiro') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white">Bom trabalho, {internalUser?.name ?? 'barbeiro'}</h1>
          <p className="mt-2 text-on-surface-variant">Seu painel mostra apenas os atendimentos e recebimentos ligados ao seu perfil.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            label="Atendimentos hoje"
            value={String(barberAppointmentsToday.length)}
            helper={`${barberCompletedToday.length} concluidos`}
            icon={<CalendarCheck size={22} />}
          />
          <MetricCard
            label="Receita de hoje"
            value={formatCurrency(barberRevenueToday)}
            helper="Cobranças registradas no seu nome"
            icon={<Wallet size={22} />}
          />
          <MetricCard
            label="Proximo cliente"
            value={nextAppointment ? new Date(nextAppointment.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem fila'}
            helper={nextAppointment ? `${resolveClientName(nextAppointment.clientId)} • ${resolveServiceName(nextAppointment.serviceId)}` : 'Nenhum atendimento futuro hoje'}
            icon={<Clock3 size={22} />}
          />
        </div>

        {barberAppointmentsToday.length === 0 ? (
          <EmptyState title="Nenhum atendimento para hoje" description="Os novos agendamentos do dia aparecerao aqui automaticamente." />
        ) : (
          <div className="glass-card rounded-3xl border border-white/5 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Sua agenda de hoje</h2>
              <p className="text-sm text-on-surface-variant">Atualizada a partir dos agendamentos reais do banco.</p>
            </div>
            <TimelineList
              items={barberAppointmentsToday}
              resolveClientName={resolveClientName}
              resolveServiceName={resolveServiceName}
              resolveBarberName={resolveBarberName}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">{barbershop.name}</h1>
        <p className="mt-2 text-on-surface-variant">
          Operacao em tempo real para agenda, clientes, equipe, financeiro e pagamentos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Faturamento do mes"
          value={formatCurrency(monthRevenue)}
          helper={`${monthTransactions.length} transações concluidas`}
          icon={<TrendingUp size={22} />}
        />
        <MetricCard
          label="Agenda de hoje"
          value={String(appointmentsToday.length)}
          helper={`${upcomingAppointments.length} atendimentos ainda pela frente`}
          icon={<CalendarCheck size={22} />}
        />
        <MetricCard
          label="Base de clientes"
          value={String(clients.length)}
          helper={`${clients.filter((client) => new Date(client.createdAt) >= monthStart).length} novos neste mes`}
          icon={<UserPlus size={22} />}
        />
        <MetricCard
          label="Ticket medio"
          value={formatCurrency(averageTicket)}
          helper="Receita media por atendimento concluido"
          icon={<Wallet size={22} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-3xl border border-white/5 p-8 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Faturamento dos ultimos 7 dias</h2>
            <p className="text-sm text-on-surface-variant">Baseado nas transações reais registradas no caixa.</p>
          </div>
          <DailyRevenueBars values={recentSevenDays} />
        </div>

        <div className="glass-card rounded-3xl border border-white/5 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Equipe em destaque</h2>
            <p className="text-sm text-on-surface-variant">Ranking do periodo atual por receita registrada.</p>
          </div>

          <div className="space-y-4">
            {topBarbers.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Cadastre barbeiros e registre transações para ver o ranking.</p>
            ) : (
              topBarbers.map((barber, index) => (
                <div key={barber.id} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-container-low p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF00]/10 font-black text-[#C8FF00]">
                    {getInitials(barber.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{barber.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {barber.completedAppointments} atendimentos concluidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">#{index + 1}</p>
                    <p className="text-sm font-black text-[#C8FF00]">{formatCurrency(barber.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-white/5 p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Agenda de hoje</h2>
            <p className="text-sm text-on-surface-variant">Os proximos atendimentos do dia ja aparecem com cliente, servico e status.</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {appointmentsToday.length > 0 ? `Atualizado em ${formatDateTime(new Date())}` : 'Sem agendamentos no dia'}
          </p>
        </div>

        {appointmentsToday.length === 0 ? (
          <EmptyState title="Sem agenda para hoje" description="Crie um agendamento e ele aparece aqui imediatamente." />
        ) : (
          <TimelineList
            items={appointmentsToday}
            resolveClientName={resolveClientName}
            resolveServiceName={resolveServiceName}
            resolveBarberName={resolveBarberName}
          />
        )}
      </div>

      {nextAppointment && (
        <div className="rounded-3xl border border-[#C8FF00]/20 bg-[#C8FF00]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C8FF00]">Proximo atendimento</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black text-white">{resolveClientName(nextAppointment.clientId)}</p>
              <p className="text-sm text-on-surface-variant">
                {resolveServiceName(nextAppointment.serviceId)} • {resolveBarberName(nextAppointment.barberId)} • {formatShortDate(nextAppointment.scheduledAt)}
              </p>
            </div>
            <div className="flex h-12 items-center rounded-2xl bg-[#C8FF00] px-4 font-black text-[#4f6700]">
              {new Date(nextAppointment.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

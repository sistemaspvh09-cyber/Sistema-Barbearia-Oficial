import { Scissors, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { formatCurrency, getInitials } from '../lib/format';

const Equipe = () => {
  const { barbers, users, appointments, transactions, loading, error } = useBarbershopRuntime();

  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);

  const team = useMemo(
    () =>
      barbers.map((barber) => {
        const profile = userById[barber.userId];
        const completedAppointments = appointments.filter(
          (appointment) => appointment.barberId === barber.id && appointment.status === 'COMPLETED',
        );
        const revenue = transactions
          .filter((transaction) => transaction.barberId === barber.id && transaction.type === 'INCOME' && transaction.status === 'COMPLETED')
          .reduce((total, transaction) => total + transaction.amount, 0);

        return {
          id: barber.id,
          name: profile?.name ?? 'Profissional',
          phone: profile?.phone ?? null,
          email: profile?.email ?? null,
          specialty: barber.specialty ?? 'Especialidade nao informada',
          commissionRate: profile?.commissionRate ?? 0,
          isActive: barber.isActive,
          completedAppointments: completedAppointments.length,
          revenue,
        };
      }),
    [appointments, barbers, transactions, userById],
  );

  const totalRevenue = team.reduce((total, barber) => total + barber.revenue, 0);
  const averageRevenue = team.length > 0 ? totalRevenue / team.length : 0;

  return (
    <div className="space-y-8 pt-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Equipe</h1>
        <p className="mt-2 text-on-surface-variant">Profissionais ativos da barbearia, com comissao e desempenho real.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SummaryCard label="Profissionais" value={String(team.length)} helper="Perfis de barbeiro vinculados" icon={<Users size={22} />} />
        <SummaryCard label="Receita da equipe" value={formatCurrency(totalRevenue)} helper="Somatorio das transações registradas" icon={<TrendingUp size={22} />} />
        <SummaryCard label="Media por barbeiro" value={formatCurrency(averageRevenue)} helper="Receita media por profissional" icon={<Scissors size={22} />} />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/5 p-8 text-center text-on-surface-variant">Carregando equipe...</div>
      ) : error ? (
        <div className="rounded-3xl border border-white/5 p-8 text-center">
          <p className="text-lg font-bold text-white">Nao foi possivel carregar a equipe</p>
          <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
        </div>
      ) : team.length === 0 ? (
        <div className="rounded-3xl border border-white/5 p-8 text-center">
          <p className="text-lg font-bold text-white">Nenhum barbeiro cadastrado</p>
          <p className="mt-2 text-sm text-on-surface-variant">Assim que os perfis forem vinculados ao modulo Barber, eles aparecem aqui automaticamente.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {team.map((barber) => (
            <div key={barber.id} className="glass-card rounded-3xl border border-white/5 p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C8FF00]/10 text-xl font-black text-[#C8FF00]">
                    {getInitials(barber.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{barber.name}</h3>
                    <p className="text-sm text-on-surface-variant">{barber.specialty}</p>
                    <p className="mt-2 text-xs text-on-surface-variant">{barber.phone || barber.email || 'Sem contato informado'}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${barber.isActive ? 'bg-[#C8FF00]/10 text-[#C8FF00]' : 'bg-red-500/10 text-red-300'}`}>
                  {barber.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="Comissao" value={`${barber.commissionRate}%`} />
                <InfoBox label="Atendimentos" value={String(barber.completedAppointments)} />
                <InfoBox label="Receita" value={formatCurrency(barber.revenue)} className="col-span-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
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
  <div className="glass-card rounded-3xl border border-white/5 p-6">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8FF00]/10 text-[#C8FF00]">{icon}</div>
    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    <p className="mt-2 text-3xl font-black text-white">{value}</p>
    <p className="mt-2 text-xs text-on-surface-variant">{helper}</p>
  </div>
);

const InfoBox = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
  <div className={`rounded-2xl border border-white/5 bg-surface-container-low p-4 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    <p className="mt-2 text-lg font-black text-white">{value}</p>
  </div>
);

export default Equipe;

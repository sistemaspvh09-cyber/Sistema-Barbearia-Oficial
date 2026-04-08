import { useMemo, useState } from 'react';
import { CalendarDays, Eye, Filter, MessageCircle, UserPlus, Users, Wallet } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { formatCurrency, formatDate, getInitials } from '../lib/format';

type FilterMode = 'all' | 'active' | 'inactive' | 'vip';

const Clientes = () => {
  const { openModal } = useModal();
  const { clients, loading, error } = useBarbershopRuntime();
  const [filter, setFilter] = useState<FilterMode>('all');

  const activeClients = clients.filter((client) => client.isActive);
  const vipClients = [...clients].sort((left, right) => right.totalSpent - left.totalSpent).slice(0, Math.min(5, clients.length));
  const averageLtv = clients.length > 0 ? clients.reduce((total, client) => total + client.totalSpent, 0) / clients.length : 0;

  const displayedClients = useMemo(() => {
    switch (filter) {
      case 'active':
        return clients.filter((client) => client.isActive);
      case 'inactive':
        return clients.filter((client) => !client.isActive);
      case 'vip':
        return vipClients;
      default:
        return clients;
    }
  }, [clients, filter, vipClients]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">Clientes</h1>
          <p className="mt-2 text-on-surface-variant">Base real da barbearia, com visitas, gasto acumulado e ultima passagem.</p>
        </div>
        <button
          onClick={() => openModal('NOVO_CLIENTE')}
          className="flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-6 py-3 font-extrabold text-[#4f6700] transition-transform hover:scale-[1.02]"
        >
          <UserPlus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total da base" value={String(clients.length)} helper="Clientes cadastrados" icon={<Users size={24} />} />
        <MetricCard label="Ativos" value={String(activeClients.length)} helper="Com cadastro habilitado" icon={<CalendarDays size={24} />} />
        <MetricCard label="VIP" value={String(vipClients.length)} helper="Top clientes por gasto" icon={<Wallet size={24} />} />
        <MetricCard label="LTV medio" value={formatCurrency(averageLtv)} helper="Gasto medio acumulado por cliente" icon={<Filter size={24} />} />
      </div>

      <div className="glass-card overflow-hidden rounded-3xl border border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-[rgba(26,25,25,0.5)] p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Ativos' },
              { id: 'inactive', label: 'Inativos' },
              { id: 'vip', label: 'VIP' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as FilterMode)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  filter === item.id ? 'bg-[#C8FF00] text-[#4f6700]' : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant">{displayedClients.length} cliente(s) nesta visualização</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Carregando clientes...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-white">Nao foi possivel carregar os clientes</p>
            <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          </div>
        ) : displayedClients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-white">Nenhum cliente encontrado</p>
            <p className="mt-2 text-sm text-on-surface-variant">Cadastre clientes reais para acompanhar recorrencia e historico financeiro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-[rgba(32,31,31,0.3)]">
                  <th className="border-b border-white/5 px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cliente</th>
                  <th className="border-b border-white/5 px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Visitas</th>
                  <th className="border-b border-white/5 px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total gasto</th>
                  <th className="border-b border-white/5 px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ultima visita</th>
                  <th className="border-b border-white/5 px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="border-b border-white/5 px-6 py-5 text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedClients.map((client) => {
                  const isVip = vipClients.some((vip) => vip.id === client.id && client.totalSpent > 0);
                  return (
                    <tr key={client.id} className={`transition-colors hover:bg-white/[0.02] ${client.isActive ? '' : 'opacity-60'}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF00]/10 font-black text-[#C8FF00]">
                            {getInitials(client.name || 'Cliente')}
                          </div>
                          <div>
                            <p className="font-bold text-white">{client.name}</p>
                            <p className="text-sm text-on-surface-variant">{client.phone || client.email || 'Sem contato cadastrado'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-white">{client.totalVisits}</td>
                      <td className="px-6 py-5 font-black text-white">{formatCurrency(client.totalSpent)}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{client.lastVisitAt ? formatDate(client.lastVisitAt) : 'Sem historico'}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            !client.isActive
                              ? 'bg-red-500/10 text-red-300'
                              : isVip
                                ? 'bg-[#C8FF00]/10 text-[#C8FF00]'
                                : 'bg-white/5 text-on-surface-variant'
                          }`}
                        >
                          {!client.isActive ? 'Inativo' : isVip ? 'VIP' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-xl bg-surface-container p-2 text-on-surface transition-colors hover:bg-surface-bright" title="Visualizar cliente">
                            <Eye size={18} />
                          </button>
                          <a
                            href={client.phone ? `https://wa.me/55${client.phone.replace(/\D/g, '')}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-xl bg-surface-container p-2 transition-colors ${client.phone ? 'text-[#C8FF00] hover:bg-surface-bright' : 'pointer-events-none text-on-surface-variant/40'}`}
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

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
  <div className="glass-card rounded-2xl p-6">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C8FF00]/10 text-[#C8FF00]">{icon}</div>
    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    <p className="mt-2 text-3xl font-black text-white">{value}</p>
    <p className="mt-2 text-xs text-on-surface-variant">{helper}</p>
  </div>
);

export default Clientes;

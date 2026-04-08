import { useMemo } from 'react';
import { CircleDollarSign, ReceiptText, Send, TrendingUp, Wallet } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useBarbershopContext } from '../contexts/BarbershopContext';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { formatCurrency, formatDateTime, getInitials } from '../lib/format';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '../services/transactionService';

const paymentLabel = (method: PaymentMethod | null) => (method ? PAYMENT_METHOD_LABEL[method] ?? method : 'Nao informado');

const Financeiro = () => {
  const { openModal } = useModal();
  const { role, barberProfile } = useBarbershopContext();
  const { transactions, barbers, users, clients, loading, error } = useBarbershopRuntime();

  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((client) => [client.id, client])), [clients]);
  const barberById = useMemo(() => Object.fromEntries(barbers.map((barber) => [barber.id, barber])), [barbers]);

  const visibleTransactions = useMemo(() => {
    if (role === 'barbeiro') {
      return transactions.filter((transaction) => transaction.barberId === barberProfile?.id);
    }
    return transactions;
  }, [barberProfile?.id, role, transactions]);

  const incomeTransactions = visibleTransactions.filter((transaction) => transaction.type === 'INCOME');
  const completedTransactions = incomeTransactions.filter((transaction) => transaction.status === 'COMPLETED');
  const pendingTransactions = visibleTransactions.filter((transaction) => transaction.status === 'PENDING');
  const totalRevenue = completedTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const cancelledRevenue = incomeTransactions
    .filter((transaction) => transaction.status === 'CANCELLED')
    .reduce((total, transaction) => total + transaction.amount, 0);

  const paymentBreakdown = (() => {
    const grouped = new Map<string, number>();

    completedTransactions.forEach((transaction) => {
      const key = paymentLabel(transaction.paymentMethod);
      grouped.set(key, (grouped.get(key) ?? 0) + transaction.amount);
    });

    return [...grouped.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .sort((left, right) => right.amount - left.amount);
  })();

  const commissionOverview = barbers
    .map((barber) => {
      const profile = userById[barber.userId];
      const revenue = transactions
        .filter((transaction) => transaction.barberId === barber.id && transaction.type === 'INCOME' && transaction.status === 'COMPLETED')
        .reduce((total, transaction) => total + transaction.amount, 0);
      const commissionRate = profile?.commissionRate ?? 0;

      return {
        id: barber.id,
        name: profile?.name ?? 'Profissional',
        revenue,
        commissionRate,
        commissionAmount: revenue * (commissionRate / 100),
      };
    })
    .filter((barber) => barber.revenue > 0)
    .sort((left, right) => right.commissionAmount - left.commissionAmount);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">{role === 'barbeiro' ? 'Meu financeiro' : 'Financeiro'}</h1>
          <p className="mt-2 text-on-surface-variant">
            {role === 'barbeiro'
              ? 'Somente as suas transações e cobranças registradas aparecem aqui.'
              : 'Visão consolidada das transações registradas no caixa e das comissões da equipe.'}
          </p>
        </div>
        <button
          onClick={() => openModal('PDV')}
          className="flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-6 py-3 font-black text-[#4f6700]"
        >
          <Send size={18} />
          Nova cobrança
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Receita concluida" value={formatCurrency(totalRevenue)} helper={`${completedTransactions.length} transacoes pagas`} icon={<Wallet size={22} />} />
        <SummaryCard label="Pendencias" value={String(pendingTransactions.length)} helper="Transacoes aguardando confirmacao" icon={<ReceiptText size={22} />} />
        <SummaryCard label="Canceladas" value={formatCurrency(cancelledRevenue)} helper="Volume que nao concluiu" icon={<CircleDollarSign size={22} />} />
        <SummaryCard label="Ticket medio" value={formatCurrency(completedTransactions.length > 0 ? totalRevenue / completedTransactions.length : 0)} helper="Media por transacao paga" icon={<TrendingUp size={22} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="glass-card rounded-3xl border border-white/5 p-8 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Transações recentes</h2>
              <p className="text-sm text-on-surface-variant">Todas derivadas do modelo unificado de Transaction.</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{visibleTransactions.length} registro(s)</p>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Carregando financeiro...</p>
          ) : error ? (
            <div>
              <p className="text-lg font-bold text-white">Nao foi possivel carregar o financeiro</p>
              <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
            </div>
          ) : visibleTransactions.length === 0 ? (
            <div>
              <p className="text-lg font-bold text-white">Nenhuma transação registrada</p>
              <p className="mt-2 text-sm text-on-surface-variant">Abra o PDV ou conclua pagamentos para alimentar o extrato.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTransactions.slice(0, 12).map((transaction) => {
                const client = transaction.clientId ? clientById[transaction.clientId] : null;
                const barber = transaction.barberId ? barberById[transaction.barberId] : null;
                const barberName = barber ? userById[barber.userId]?.name ?? 'Profissional' : 'Sem profissional';
                return (
                  <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-surface-container-low p-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8FF00]/10 font-black text-[#C8FF00]">
                        {getInitials(client?.name ?? transaction.description ?? 'Tx')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{transaction.description || 'Transacao sem descricao'}</p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {(client?.name ?? 'Cliente avulso')} • {barberName} • {paymentLabel(transaction.paymentMethod)}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">{formatDateTime(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-white">{formatCurrency(transaction.amount)}</p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        transaction.status === 'COMPLETED'
                          ? 'bg-[#C8FF00]/10 text-[#C8FF00]'
                          : transaction.status === 'PENDING'
                            ? 'bg-yellow-500/10 text-yellow-300'
                            : 'bg-red-500/10 text-red-300'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl border border-white/5 p-8">
            <h2 className="text-xl font-bold text-white">Meios de pagamento</h2>
            {paymentBreakdown.length === 0 ? (
              <p className="mt-4 text-sm text-on-surface-variant">Os percentuais aparecem quando houver transações concluídas.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {paymentBreakdown.map((entry) => {
                  const pct = totalRevenue > 0 ? (entry.amount / totalRevenue) * 100 : 0;
                  return (
                    <div key={entry.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-white">{entry.label}</span>
                        <span className="font-bold text-on-surface-variant">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                        <div className="h-full rounded-full bg-[#C8FF00]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {role !== 'barbeiro' && (
            <div className="glass-card rounded-3xl border border-white/5 p-8">
              <h2 className="text-xl font-bold text-white">Comissões estimadas</h2>
              {commissionOverview.length === 0 ? (
                <p className="mt-4 text-sm text-on-surface-variant">As comissões são calculadas assim que existirem cobranças vinculadas aos barbeiros.</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {commissionOverview.slice(0, 6).map((barber) => (
                    <div key={barber.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-container-low p-4">
                      <div>
                        <p className="text-sm font-bold text-white">{barber.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {barber.commissionRate}% sobre {formatCurrency(barber.revenue)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-[#C8FF00]">{formatCurrency(barber.commissionAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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

export default Financeiro;

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Loader2, ArrowLeft, Receipt } from 'lucide-react';
import { parseInfinitePayResult, getPendingTransaction, clearPendingTransaction } from '../lib/infinitePay';
import { emitAppDataChanged } from '../lib/events';
import {
  findTransactionByExternalOrderId,
  PAYMENT_METHOD_LABEL,
  upsertTransactionByExternalOrderId,
  updateTransaction,
} from '../services/transactionService';

// ─── Card brand icon map ──────────────────────────────────────────────────────

const BRAND_LABEL: Record<string, string> = {
  mastercard: 'Mastercard',
  visa:       'Visa',
  elo:        'Elo',
  hipercard:  'Hipercard',
  amex:       'American Express',
};

// ─── Confetti particles ───────────────────────────────────────────────────────

const Confetti = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
    {Array.from({ length: 22 }).map((_, i) => {
      const colors = ['#C8FF00', '#ffffff', '#a3c900', '#e0ff80'];
      const color  = colors[i % colors.length];
      const left   = `${(i * 4.5 + 3) % 100}%`;
      const delay  = `${(i * 0.12).toFixed(2)}s`;
      const size   = `${6 + (i % 5)}px`;
      return (
        <div key={i} className="absolute top-0 rounded-sm opacity-0"
          style={{
            left, width: size, height: size, background: color,
            animation: `confettiDrop 2.4s ${delay} ease-in forwards`,
          }} />
      );
    })}
    <style>{`
      @keyframes confettiDrop {
        0%   { opacity: 1; transform: translateY(-20px) rotate(0deg); }
        100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
      }
    `}</style>
  </div>
);

// ─── Animated checkmark ───────────────────────────────────────────────────────

const AnimatedCheck = () => (
  <svg viewBox="0 0 80 80" className="w-20 h-20">
    <style>{`
      @keyframes circleIn { from { stroke-dashoffset: 251; } to { stroke-dashoffset: 0; } }
      @keyframes checkIn  { from { stroke-dashoffset: 80;  } to { stroke-dashoffset: 0; } }
    `}</style>
    <circle cx="40" cy="40" r="36" fill="none" stroke="#C8FF00" strokeWidth="5"
      strokeDasharray="251" style={{ animation: 'circleIn 0.5s ease-out forwards' }} />
    <polyline points="24,41 35,52 56,30" fill="none" stroke="#C8FF00" strokeWidth="5"
      strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80"
      style={{ animation: 'checkIn 0.4s 0.5s ease-out forwards', strokeDashoffset: 80 }} />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

type State = 'loading' | 'success' | 'error';

export default function PaymentResult() {
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const [state, setState]   = useState<State>('loading');
  const [errorMsg, setError] = useState('');
  const [txData, setTxData] = useState<{
    amount: number;
    method: string;
    brand: string;
    aut: string;
    nsu: string;
    description: string;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const result = parseInfinitePayResult(searchParams.toString());

      if (!result) {
        setError('Parâmetros de retorno inválidos.');
        setState('error');
        return;
      }

      const existing = await findTransactionByExternalOrderId(result.orderId);

      // Error from InfinitePay
      if (result.warning) {
        if (existing) {
          await updateTransaction(existing.id, {
            status: 'CANCELLED',
            gateway: 'infinitepay',
            gatewayReference: result.nsu || existing.gatewayReference,
            metadata: {
              ...(existing.metadata ?? {}),
              warning: result.warning,
              result,
            },
          });
        }

        setError(result.warning);
        setState('error');
        return;
      }

      const pending = getPendingTransaction(result.orderId);

      try {
        if (pending?.barbershopId || existing) {
          const source = pending ?? {
            amountCents: Math.round((existing?.amount ?? 0) * 100),
            paymentMethod: existing?.paymentMethod ?? 'CREDIT_CARD',
            description: existing?.description || 'Pagamento via InfinitePay',
            clientId: existing?.clientId ?? null,
            barbershopId: existing?.barbershopId ?? null,
            installments: 1,
            orderId: result.orderId,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
          };

          await upsertTransactionByExternalOrderId({
            barbershopId: source.barbershopId ?? existing?.barbershopId ?? '',
            clientId: source.clientId ?? existing?.clientId ?? null,
            barberId: existing?.barberId ?? null,
            type: 'INCOME',
            amount: source.amountCents / 100,
            paymentMethod: source.paymentMethod,
            description: source.description || 'Pagamento via InfinitePay',
            category: 'servico',
            status: 'COMPLETED',
            gateway: 'infinitepay',
            gatewayReference: result.nsu || result.aut,
            externalOrderId: result.orderId,
            metadata: {
              ...(existing?.metadata ?? {}),
              infinitePay: result,
              installments: source.installments,
            },
          });
          emitAppDataChanged('transaction-completed');
        }
      } catch (e) {
        console.error('Falha ao salvar transação:', e);
        // Don't fail the page — the payment already went through
      }

      clearPendingTransaction(result.orderId);

      setTxData({
        amount:      pending ? pending.amountCents / 100 : 0,
        method:      pending
          ? PAYMENT_METHOD_LABEL[pending.paymentMethod]
          : 'Cartão',
        brand:  BRAND_LABEL[result.cardBrand.toLowerCase()] ?? result.cardBrand,
        aut:    result.aut,
        nsu:    result.nsu,
        description: pending?.description || 'Pagamento via InfinitePay',
        orderId: result.orderId,
      });

      setState('success');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDate = () =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date());

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#C8FF00] mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Processando pagamento...</p>
          <p className="text-on-surface-variant text-sm mt-1">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full border-4 border-red-500/40 flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Pagamento não aprovado</h1>
          <p className="text-on-surface-variant text-sm mb-8">
            {errorMsg || 'O pagamento foi recusado ou cancelado.'}
          </p>
          <button
            onClick={() => navigate('/financeiro')}
            className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-2xl flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Voltar ao sistema
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti />

      <div className="max-w-sm w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Check animation */}
        <div className="flex justify-center mb-6">
          <AnimatedCheck />
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-1">Pagamento aprovado!</h1>
        <p className="text-on-surface-variant text-center text-sm mb-8">
          Transação processada com sucesso via InfinitePay
        </p>

        {/* Receipt card */}
        {txData && (
          <div className="bg-[#161616] rounded-3xl border border-white/5 overflow-hidden mb-6">
            {/* Tear line */}
            <div className="h-px bg-[repeating-linear-gradient(90deg,transparent_0,transparent_6px,#ffffff18_6px,#ffffff18_12px)]" />

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="text-center py-4">
                <p className="text-4xl font-black text-[#C8FF00]">{formatCurrency(txData.amount)}</p>
                <p className="text-sm text-on-surface-variant mt-1">{txData.method} {txData.brand && `· ${txData.brand}`}</p>
              </div>

              <div className="h-px bg-white/5" />

              {/* Details */}
              <div className="space-y-3 text-sm">
                <Row label="Descrição"  value={txData.description} />
                <Row label="Data/Hora"  value={formatDate()} />
                <Row label="Autorização" value={txData.aut} mono />
                <Row label="NSU"        value={txData.nsu.substring(0, 8).toUpperCase()} mono />
                <Row label="Pedido"     value={txData.orderId} mono />
              </div>
            </div>

            <div className="h-px bg-[repeating-linear-gradient(90deg,transparent_0,transparent_6px,#ffffff18_6px,#ffffff18_12px)]" />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/financeiro')}
            className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-[#b3e600] transition-colors shadow-[0_0_24px_rgba(200,255,0,0.25)]">
            <Receipt size={18} /> Ver no Financeiro
          </button>
          <button
            onClick={() => navigate('/app')}
            className="w-full py-3 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt row helper ───────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`text-white font-bold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

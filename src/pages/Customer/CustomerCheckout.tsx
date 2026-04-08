import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Loader2, SmartphoneNfc, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBookingDraft, clearBookingDraft } from '../../lib/customerBooking';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { getOrCreateClientForBarbershop } from '../../lib/appData';
import { createTransaction, type PaymentMethod } from '../../services/transactionService';
import { supabase } from '../../lib/supabase';
import { emitAppDataChanged } from '../../lib/events';

const METHOD_MAP: Record<'pix' | 'card' | 'local', PaymentMethod> = {
  pix: 'PIX',
  card: 'CREDIT_CARD',
  local: 'PREFERENCIA_CLIENTE',
};

const CustomerCheckout = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [method, setMethod] = useState<'pix' | 'card' | 'local' | ''>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = useMemo(() => getBookingDraft(), []);

  useEffect(() => {
    if (!draft) {
      navigate('/app/agendar', { replace: true });
    }
  }, [draft, navigate]);

  const handleFinish = async () => {
    if (!draft || !method) {
      return;
    }

    if (!session || !user) {
      navigate('/app/login');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { client } = await getOrCreateClientForBarbershop(user, draft.barbershopId);

      const { data: appointment, error: appointmentError } = await supabase
        .from('Appointment')
        .insert({
          barbershopId: draft.barbershopId,
          clientId: client.id,
          barberId: draft.barberId ?? null,
          serviceId: draft.serviceId,
          scheduledAt: new Date(draft.scheduledAt).toISOString(),
          duration: draft.serviceDuration,
          status: 'SCHEDULED',
          price: draft.servicePrice,
          paymentMethod: METHOD_MAP[method],
          paymentStatus: 'PENDING',
          notes: 'Agendamento criado pelo app do cliente',
        })
        .select('*')
        .single();

      if (appointmentError || !appointment) {
        throw appointmentError ?? new Error('Nao foi possivel criar o agendamento.');
      }

      await createTransaction({
        barbershopId: draft.barbershopId,
        appointmentId: appointment.id as string,
        clientId: client.id,
        barberId: draft.barberId ?? null,
        type: 'INCOME',
        amount: draft.servicePrice,
        description: draft.serviceName,
        category: 'servico',
        paymentMethod: METHOD_MAP[method],
        status: 'PENDING',
        metadata: {
          source: 'customer_app',
          scheduledAt: draft.scheduledAt,
        },
      });

      emitAppDataChanged('customer-booking-created');
      clearBookingDraft();
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/app/historico');
      }, 1800);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : 'Nao foi possivel concluir a reserva.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return null;
  }

  if (isSuccess) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-6 animate-in zoom-in">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#C8FF00]/10">
          <CheckCircle2 size={48} className="text-[#C8FF00]" />
        </div>
        <h2 className="text-center text-2xl font-black text-white">
          Reserva
          <br />
          Confirmada
        </h2>
        <p className="mt-4 text-center text-sm text-on-surface-variant">
          Você será redirecionado para o seu histórico com o agendamento salvo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0D0D0D]">
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-bold uppercase tracking-wider text-white">Resumo</h2>
          <div className="space-y-3 rounded-2xl border border-white/5 bg-surface-container p-4">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{draft.serviceName}</span>
              <span className="font-bold text-white">{formatCurrency(draft.servicePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Data/Hora</span>
              <span className="font-bold text-white">{formatDateTime(draft.scheduledAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Profissional</span>
              <span className="font-bold text-white">{draft.barberName ?? 'Qualquer profissional'}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-3">
              <span className="font-bold text-white">Total</span>
              <span className="text-lg font-black text-[#C8FF00]">{formatCurrency(draft.servicePrice)}</span>
            </div>
          </div>
        </div>

        {!session && (
          <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            Faça login antes de confirmar. O sistema precisa vincular esse horário ao seu perfil de cliente.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Forma de pagamento</h2>
          <div className="space-y-3">
            <MethodButton
              selected={method === 'pix'}
              onClick={() => setMethod('pix')}
              icon={<SmartphoneNfc size={20} />}
              title="PIX manual"
              subtitle="O agendamento fica como pagamento pendente"
            />
            <MethodButton
              selected={method === 'card'}
              onClick={() => setMethod('card')}
              icon={<CreditCard size={20} />}
              title="Cartão"
              subtitle="Pagamento pendente para ser processado na barbearia"
            />
            <MethodButton
              selected={method === 'local'}
              onClick={() => setMethod('local')}
              icon={<Wallet size={20} />}
              title="Pagar no local"
              subtitle="Reserva confirmada e pagamento feito presencialmente"
            />
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button
          onClick={handleFinish}
          disabled={!method || saving}
          className="w-full rounded-2xl bg-[#C8FF00] p-4 font-black text-[#4f6700] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="mx-auto animate-spin" size={20} /> : 'Confirmar e agendar'}
        </button>
      </div>
    </div>
  );
};

const MethodButton = ({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
      selected ? 'border-[#C8FF00]/50 bg-[#C8FF00]/10' : 'border-white/5 bg-surface-container hover:border-white/20'
    }`}
  >
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? 'bg-[#C8FF00] text-[#4f6700]' : 'bg-white/5 text-on-surface-variant'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">{subtitle}</p>
    </div>
  </button>
);

export default CustomerCheckout;

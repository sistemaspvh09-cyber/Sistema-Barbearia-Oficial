import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CreditCard, Smartphone, DollarSign, Wifi, Check, Share2, RotateCcw, ChevronLeft, Loader2, Banknote } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createTransaction, PAYMENT_METHOD_LABEL, type PaymentMethod } from '../../services/transactionService';
import { triggerTapToPay } from '../../lib/infinitePay';
import { useNotificationToast } from '../../contexts/NotificationToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface Client {
  id: string;
  name: string;
  phone: string | null;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCents(value: string): number {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits || '0', 10);
}

function formatInput(cents: number): string {
  if (cents === 0) return '';
  const str = cents.toString().padStart(3, '0');
  const int = str.slice(0, -2);
  const dec = str.slice(-2);
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

function generateTransactionId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Payment method options ───────────────────────────────────────────────────

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'CREDIT_CARD', label: 'Cartão de Crédito', sublabel: 'Taxa 1,25%', icon: <CreditCard size={28} />, color: 'text-blue-400' },
  { id: 'DEBIT_CARD',  label: 'Cartão de Débito',  sublabel: 'Taxa 0,98%', icon: <CreditCard size={28} />, color: 'text-purple-400' },
  { id: 'PIX',         label: 'PIX',                sublabel: 'Instantâneo', icon: <Smartphone size={28} />, color: 'text-[#C8FF00]' },
  { id: 'CASH',        label: 'Dinheiro',           sublabel: 'Sem taxa',   icon: <Banknote size={28} />,   color: 'text-green-400' },
];

// ─── Animated checkmark ───────────────────────────────────────────────────────

const AnimatedCheck = () => (
  <svg viewBox="0 0 80 80" className="w-20 h-20">
    <style>{`
      @keyframes circleIn { from { stroke-dashoffset: 226; } to { stroke-dashoffset: 0; } }
      @keyframes checkIn  { to   { stroke-dashoffset: 0; } }
      @keyframes nfcPulse { 0%,100% { transform:scale(1);opacity:1; } 50% { transform:scale(1.15);opacity:0.7; } }
      @keyframes confettiDrop { 0% { transform:translateY(-20px) rotate(0deg);opacity:1; } 100% { transform:translateY(80px) rotate(720deg);opacity:0; } }
    `}</style>
    <circle cx="40" cy="40" r="36" fill="none" stroke="#C8FF00" strokeWidth="4"
      strokeDasharray="226" strokeDashoffset="226"
      style={{ animation: 'circleIn 0.6s ease forwards' }} />
    <polyline points="22,40 35,53 58,27" fill="none" stroke="#C8FF00" strokeWidth="5"
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray="60" strokeDashoffset="60"
      style={{ animation: 'checkIn 0.4s 0.5s ease forwards' }} />
  </svg>
);

// ─── Confetti ─────────────────────────────────────────────────────────────────

const Confetti = () => {
  const colors = ['#C8FF00', '#FFD700', '#FF6B6B', '#4ECDC4', '#FF9F43'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${(i * 5.5) % 100}%`, top: '-8px',
            backgroundColor: colors[i % colors.length],
            animation: `confettiDrop ${0.8 + (i % 4) * 0.15}s ${i * 0.07}s ease-in forwards`,
          }} />
      ))}
    </div>
  );
};

// ─── PIX countdown timer ─────────────────────────────────────────────────────

const PixTimer = ({ onExpire }: { onExpire: () => void }) => {
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    if (seconds <= 0) { onExpire(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpire]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const pct = seconds / 300;
  const r = 20;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-3">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#ffffff10" strokeWidth="3" />
        <circle cx="26" cy="26" r={r} fill="none"
          stroke={pct > 0.33 ? '#C8FF00' : '#FF6B6B'}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
        <text x="26" y="31" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{mm}:{ss}</text>
      </svg>
      <div>
        <p className="text-xs font-bold text-white">Aguardando pagamento</p>
        <p className="text-[11px] text-on-surface-variant">QR code expira em {mm}:{ss}</p>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const PDVModal = () => {
  const { activeModal, closeModal } = useModal();
  const { user } = useAuth();
  const { showToast } = useNotificationToast();

  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Step 1
  const [description, setDescription] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Step 3
  const [cashReceived, setCashReceived] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Step 4
  const [transactionId] = useState(generateTransactionId);
  const [transactionDate] = useState(() => new Date());
  const [showConfetti, setShowConfetti] = useState(false);

  // Load barbershopId + clients
  useEffect(() => {
    if (!user || activeModal !== 'PDV') return;
    supabase.from('User').select('barbershopId').eq('authId', user.id).single().then(({ data }) => {
      if (!data?.barbershopId) return;
      const bsId = data.barbershopId as string;
      setBarbershopId(bsId);
      supabase.from('Client').select('id, userId').eq('barbershopId', bsId).eq('isActive', true).limit(100).then(async ({ data: cls }) => {
        if (!cls?.length) return;
        const { data: users } = await supabase.from('User').select('id, name, phone').in('id', cls.map((c: { userId: string }) => c.userId));
        if (users) {
          setClients(cls.map((c: { id: string; userId: string }) => {
            const u = (users as { id: string; name: string; phone: string | null }[]).find((u) => u.id === c.userId);
            return { id: c.id, name: u?.name ?? 'Cliente', phone: u?.phone ?? null };
          }));
        }
      });
    });
  }, [user, activeModal]);

  useEffect(() => {
    if (step === 4) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const goTo = useCallback((s: Step, dir: 'forward' | 'back' = 'forward') => {
    setDirection(dir);
    setStep(s);
  }, []);

  const reset = () => {
    setStep(1);
    setDescription('');
    setAmountCents(0);
    setSelectedClientId('');
    setSelectedMethod(null);
    setCashReceived(0);
    setProcessing(false);
    setClientSearch('');
  };

  const confirmPayment = useCallback(async () => {
    if (!barbershopId || !selectedMethod) return;
    setProcessing(true);
    try {
      await createTransaction({
        barbershopId,
        type: 'INCOME',
        amount: amountCents / 100,
        description: description || 'Serviço',
        category: 'servico',
        paymentMethod: selectedMethod,
      });
      goTo(4);
    } catch {
      showToast({ type: 'error', title: 'Erro ao registrar pagamento', message: 'Tente novamente.' });
    } finally {
      setProcessing(false);
    }
  }, [barbershopId, selectedMethod, amountCents, description, goTo, showToast]);

  if (activeModal !== 'PDV') return null;

  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const change = cashReceived - amountCents;

  const slideClass = direction === 'forward'
    ? 'animate-in slide-in-from-right-4 fade-in duration-300'
    : 'animate-in slide-in-from-left-4 fade-in duration-300';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_60px_rgba(200,255,0,0.08)] relative flex flex-col max-h-[90dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[rgba(200,255,0,0.02)]">
          <div className="flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button onClick={() => step === 2 ? goTo(1, 'back') : goTo(2, 'back')}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft size={18} className="text-on-surface-variant" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_6px_rgba(200,255,0,0.8)]" />
                {step === 1 && 'Nova Cobrança'}
                {step === 2 && 'Forma de Pagamento'}
                {step === 3 && (selectedMethod === 'PIX' ? 'Aguardando PIX' : selectedMethod === 'CASH' ? 'Pagamento em Dinheiro' : 'Aproximar Cartão')}
                {step === 4 && 'Pagamento Confirmado'}
              </h2>
              {step < 4 && (
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-[#C8FF00]' : s < step ? 'w-3 bg-[#C8FF00]/50' : 'w-3 bg-white/10'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => { closeModal(); reset(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── Step 1: Cobrança ──────────────────────────── */}
          {step === 1 && (
            <div className={`p-6 space-y-5 ${slideClass}`}>
              <div className="text-center py-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Valor da Cobrança</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-black text-on-surface-variant">R$</span>
                  <input ref={amountRef} type="text" inputMode="numeric"
                    value={formatInput(amountCents)}
                    onChange={(e) => setAmountCents(parseCents(e.target.value))}
                    placeholder="0,00"
                    className="text-5xl font-black text-white bg-transparent border-none outline-none text-center w-48 placeholder:text-white/20"
                  />
                </div>
                <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#C8FF00]/40 to-transparent" />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Descrição do Serviço</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Corte + Barba"
                  className="w-full px-4 py-3 bg-surface-container border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8FF00] transition-colors placeholder:text-white/20" />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Cliente (opcional)</label>
                <input type="text" value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); if (selectedClientId) setSelectedClientId(''); }}
                  placeholder="Buscar cliente..."
                  className="w-full px-4 py-3 bg-surface-container border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8FF00] transition-colors placeholder:text-white/20 mb-2" />
                {clientSearch && !selectedClientId && filteredClients.length > 0 && (
                  <div className="bg-surface-container-highest border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {filteredClients.slice(0, 5).map((c) => (
                      <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors text-sm text-white"
                        onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name); }}>
                        <span className="font-semibold">{c.name}</span>
                        {c.phone && <span className="text-on-surface-variant ml-2 text-xs">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {selectedClientId && selectedClient && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C8FF00]" />
                    <span className="text-xs text-[#C8FF00] font-bold">{selectedClient.name} selecionado</span>
                    <button onClick={() => { setSelectedClientId(''); setClientSearch(''); }} className="text-xs text-on-surface-variant hover:text-white ml-auto">remover</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Método de pagamento ───────────────── */}
          {step === 2 && (
            <div className={`p-6 ${slideClass}`}>
              <div className="text-center mb-6">
                <p className="text-3xl font-black text-[#C8FF00]">{formatCurrency(amountCents)}</p>
                {description && <p className="text-sm text-on-surface-variant mt-1">{description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                    className={`p-5 rounded-2xl border transition-all text-left ${selectedMethod === m.id ? 'border-[#C8FF00] bg-[#C8FF00]/10 shadow-[0_0_16px_rgba(200,255,0,0.15)]' : 'border-white/10 bg-surface-container hover:border-white/30'}`}>
                    <div className={`mb-3 ${selectedMethod === m.id ? 'text-[#C8FF00]' : m.color}`}>{m.icon}</div>
                    <p className={`text-sm font-bold ${selectedMethod === m.id ? 'text-white' : 'text-on-surface-variant'}`}>{m.label}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{m.sublabel}</p>
                    {selectedMethod === m.id && (
                      <div className="mt-2 w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center ml-auto">
                        <Check size={12} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Processamento ─────────────────────── */}
          {step === 3 && (
            <div className={`p-6 ${slideClass}`}>

              {/* Cartão */}
              {(selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD') && (
                <div className="text-center py-6">
                  <p className="text-3xl font-black text-[#C8FF00] mb-2">{formatCurrency(amountCents)}</p>
                  <p className="text-sm text-on-surface-variant mb-8">{selectedMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Cartão de Débito'}</p>
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="w-28 h-28 rounded-full bg-[#C8FF00]/5 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#C8FF00]/10 flex items-center justify-center"
                        style={{ animation: 'nfcPulse 1.8s ease-in-out infinite' }}>
                        <Wifi size={40} className="text-[#C8FF00] rotate-90" />
                      </div>
                    </div>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="absolute rounded-full border border-[#C8FF00]/20"
                        style={{ width: `${120 + i * 40}px`, height: `${120 + i * 40}px`, animation: `nfcPulse ${1.4 + i * 0.3}s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                  <p className="text-white font-bold mb-1">Aproxime o cartão ao leitor</p>
                  <p className="text-xs text-on-surface-variant mb-6">Via InfinitePay · NFC habilitado</p>
                  <button onClick={() => triggerTapToPay({ amount: amountCents / 100, referenceId: transactionId })}
                    className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl mb-3 hover:bg-[#b3e600] transition-colors shadow-[0_0_20px_rgba(200,255,0,0.25)]">
                    <Wifi size={18} className="inline mr-2 rotate-90" /> Abrir InfinitePay
                  </button>
                  <button onClick={confirmPayment} disabled={processing}
                    className="w-full py-3 bg-surface-container border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50">
                    {processing && <Loader2 size={16} className="inline animate-spin mr-2" />}
                    Confirmar Manualmente
                  </button>
                </div>
              )}

              {/* PIX */}
              {selectedMethod === 'PIX' && (
                <div className="text-center py-4">
                  <p className="text-3xl font-black text-[#C8FF00] mb-1">{formatCurrency(amountCents)}</p>
                  <p className="text-sm text-on-surface-variant mb-6">Pagamento via PIX</p>
                  <div className="inline-block p-4 bg-white rounded-2xl mb-4 shadow-[0_0_30px_rgba(200,255,0,0.15)]">
                    <QRCodeSVG
                      value={`PIX:${(amountCents / 100).toFixed(2)}:${description || 'Servico'}:${transactionId}`}
                      size={180} level="M" bgColor="#FFFFFF" fgColor="#0D0D0D" />
                  </div>
                  <div className="flex items-center justify-center mb-6">
                    <PixTimer onExpire={() => goTo(2, 'back')} />
                  </div>
                  <button onClick={confirmPayment} disabled={processing}
                    className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-colors shadow-[0_0_20px_rgba(200,255,0,0.25)] disabled:opacity-50">
                    {processing ? <Loader2 size={16} className="inline animate-spin mr-2" /> : <Check size={18} className="inline mr-2" />}
                    Confirmar Pagamento PIX
                  </button>
                </div>
              )}

              {/* Dinheiro */}
              {selectedMethod === 'CASH' && (
                <div className="py-4 space-y-6">
                  <div className="text-center">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total a Cobrar</p>
                    <p className="text-4xl font-black text-[#C8FF00]">{formatCurrency(amountCents)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Valor Recebido</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">R$</span>
                      <input type="text" inputMode="numeric"
                        value={formatInput(cashReceived)}
                        onChange={(e) => setCashReceived(parseCents(e.target.value))}
                        placeholder="0,00"
                        className="w-full pl-12 pr-4 py-4 bg-surface-container border border-white/10 rounded-xl text-white text-2xl font-black focus:outline-none focus:border-[#C8FF00] transition-colors" />
                    </div>
                  </div>
                  {cashReceived > 0 && (
                    <div className={`p-5 rounded-2xl border ${change >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Troco</p>
                      <p className={`text-3xl font-black ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? formatCurrency(change) : `Falta ${formatCurrency(-change)}`}
                      </p>
                    </div>
                  )}
                  <button onClick={confirmPayment} disabled={processing || cashReceived < amountCents}
                    className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {processing ? <Loader2 size={16} className="inline animate-spin mr-2" /> : <Check size={18} className="inline mr-2" />}
                    Confirmar Pagamento
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Comprovante ───────────────────────── */}
          {step === 4 && (
            <div className={`p-6 relative ${slideClass}`}>
              {showConfetti && <Confetti />}
              <div className="text-center py-4">
                <div className="flex justify-center mb-4"><AnimatedCheck /></div>
                <p className="text-2xl font-black text-white mb-1">Pagamento Confirmado!</p>
                <p className="text-sm text-on-surface-variant">Transação registrada com sucesso</p>
              </div>

              {/* Receipt */}
              <div className="mt-6 bg-surface-container rounded-2xl overflow-hidden border border-white/5">
                <div className="px-6 pt-6 pb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Valor</span>
                    <span className="font-black text-[#C8FF00] text-lg">{formatCurrency(amountCents)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Método</span>
                    <span className="text-sm font-bold text-white">{selectedMethod ? PAYMENT_METHOD_LABEL[selectedMethod] : '—'}</span>
                  </div>
                  {description && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">Serviço</span>
                      <span className="text-sm font-bold text-white">{description}</span>
                    </div>
                  )}
                  {selectedClient && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">Cliente</span>
                      <span className="text-sm font-bold text-white">{selectedClient.name}</span>
                    </div>
                  )}
                  {selectedMethod === 'CASH' && change > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">Troco</span>
                      <span className="text-sm font-bold text-green-400">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
                {/* Tear line */}
                <div className="flex items-center px-4 py-1">
                  <div className="flex-1 border-t border-dashed border-white/10" />
                  <div className="w-3 h-3 rounded-full bg-[#0D0D0D] mx-1 border border-white/10" />
                  <div className="flex-1 border-t border-dashed border-white/10" />
                </div>
                <div className="px-6 pb-5 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Data/Hora</span>
                    <span className="text-xs text-white font-mono">
                      {transactionDate.toLocaleDateString('pt-BR')} {transactionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Cód. Transação</span>
                    <span className="text-xs text-white font-mono tracking-widest">{transactionId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#0a0a0a] shrink-0">
          {step === 1 && (
            <button onClick={() => amountCents > 0 ? goTo(2) : amountRef.current?.focus()}
              disabled={amountCents === 0}
              className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,255,0,0.2)]">
              Escolher Pagamento →
            </button>
          )}
          {step === 2 && (
            <button onClick={() => selectedMethod && goTo(3)} disabled={!selectedMethod}
              className="w-full py-4 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,255,0,0.2)]">
              Confirmar →
            </button>
          )}
          {step === 4 && (
            <div className="flex gap-3">
              <button onClick={() => {
                const text = `✂️ Comprovante BarberPro\nValor: ${formatCurrency(amountCents)}\nMétodo: ${selectedMethod ? PAYMENT_METHOD_LABEL[selectedMethod] : ''}\n` +
                  (description ? `Serviço: ${description}\n` : '') + (selectedClient ? `Cliente: ${selectedClient.name}\n` : '') +
                  `Data: ${transactionDate.toLocaleString('pt-BR')}\nCód.: ${transactionId}`;
                if (navigator.share) navigator.share({ text }); else navigator.clipboard.writeText(text);
              }} className="flex-1 py-3 bg-surface-container border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} /> Compartilhar
              </button>
              <button onClick={reset}
                className="flex-1 py-3 bg-surface-container border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Nova Cobrança
              </button>
              <button onClick={() => { closeModal(); reset(); }}
                className="px-5 py-3 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-colors">
                <DollarSign size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDVModal;

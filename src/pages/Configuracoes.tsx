import {
  Store, BellRing, ShieldCheck, CreditCard,
  Smartphone, Save, Globe, Clock, CalendarDays, SmartphoneNfc,
  CheckCircle2, Loader2, Upload, Link, Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useBarbershopContext } from '../contexts/BarbershopContext';
import { useNotifications } from '../hooks/useNotifications';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { useBarbershopSettings } from '../hooks/useBarbershopSettings';
import { useNotificationToast } from '../contexts/NotificationToastContext';
import { isAutoOpenEnabled, setAutoOpen, createTestEvent } from '../lib/googleCalendar';
import { getCachedHandle, setCachedHandle, openInfinitePay } from '../lib/infinitePay';
import { emitAppDataChanged } from '../lib/events';
import { formatCurrency, formatDateTime } from '../lib/format';
import { supabase } from '../lib/supabase';

// ─── Day labels ───────────────────────────────────────────────────────────────
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type AdminTab = 'perfil' | 'horario' | 'integracoes' | 'pagamentos' | 'notificacoes' | 'seguranca' | 'app';

// ─── Barber view ──────────────────────────────────────────────────────────────

const BarberView = () => {
  const [syncEnabled, setSyncEnabledLocal] = useState(isAutoOpenEnabled());

  const handleToggleSync = (enabled: boolean) => {
    setAutoOpen(enabled);
    setSyncEnabledLocal(enabled);
  };

  return (
    <div className="pt-8 pb-12 animate-in fade-in duration-300">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Sua Conta</h1>
        <p className="text-on-surface-variant font-medium">Configure suas integrações e preferências pessoais.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#C8FF00]/10 text-[#C8FF00] rounded-xl font-bold border border-[#C8FF00]/20 text-left">
            <SmartphoneNfc size={20} /> <span>Integrações</span>
          </button>
        </div>

        <div className="flex-1 space-y-8">
          {/* Recebimento */}
          <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
              <SmartphoneNfc className="text-on-surface-variant" size={28} /> Recebimento de Pagamentos
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
              Todos os pagamentos são processados na conta da barbearia. O valor cobrado em cada atendimento aparece na aba <strong className="text-white">Meu Financeiro</strong>.
            </p>
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Conta do Salão Ativa</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Os valores dos seus atendimentos são registrados automaticamente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
              <CalendarDays className="text-white" size={28} /> Google Agenda
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
              Após cada agendamento, o Google Calendar abre com o evento preenchido. Basta clicar em <strong className="text-white">Salvar</strong>.
            </p>

            <div className="p-5 bg-surface-container border border-white/5 rounded-2xl mb-4 flex items-center gap-4">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center p-2 shrink-0">
                <GoogleIcon />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Abre no Google Calendar da sua conta</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Já conectado à conta Google do navegador</p>
              </div>
              <span className="text-[#C8FF00] text-xs font-bold shrink-0">✓ Ativo</span>
            </div>

            <div className="p-4 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#C8FF00]">Abrir Calendar após agendar</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Abre nova aba com o evento preenchido automaticamente</p>
              </div>
              <button onClick={() => handleToggleSync(!syncEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${syncEnabled ? 'bg-[#C8FF00]' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-[#0D0D0D] shadow-md transition-transform ${syncEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Google icon helper ───────────────────────────────────────────────────────

const GoogleIcon = ({ small = false }: { small?: boolean }) => (
  <svg viewBox="0 0 48 48" className={small ? 'w-4 h-4' : 'w-full h-full'}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ─── Admin view ───────────────────────────────────────────────────────────────

const AdminView = () => {
  const { user } = useAuth();
  const { internalUser } = useBarbershopContext();
  const { showToast } = useNotificationToast();
  const { barbershop, workingHours, setWorkingHours, loading, saving, saveBarbershop, saveWorkingHours, uploadLogo } = useBarbershopSettings();
  const { services, transactions, appointments, loading: runtimeLoading } = useBarbershopRuntime();
  const { notifications, unreadCount, markAllAsRead, loading: notificationsLoading } = useNotifications();

  const [activeTab, setActiveTab] = useState<AdminTab>('perfil');
  const [form, setForm] = useState({
    name: '', cnpj: '', phone: '', email: '', description: '',
    address: '', zipCode: '', neighborhood: '', city: '', state: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Google Calendar auto-open toggle
  const [syncEnabled, setSyncEnabledLocal] = useState(isAutoOpenEnabled());

  // InfinitePay handle
  const [ipayHandle, setIpayHandle] = useState(getCachedHandle());
  const [savingHandle, setSavingHandle] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    duration: '30',
    category: '',
  });
  const [savingService, setSavingService] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copiar link');

  // Populate form when barbershop data loads
  useEffect(() => {
    if (barbershop) {
      setForm({
        name: barbershop.name ?? '',
        cnpj: barbershop.cnpj ?? '',
        phone: barbershop.phone ?? '',
        email: barbershop.email ?? '',
        description: barbershop.description ?? '',
        address: barbershop.address ?? '',
        zipCode: barbershop.zipCode ?? '',
        neighborhood: (barbershop as unknown as Record<string, string>).neighborhood ?? '',
        city: barbershop.city ?? '',
        state: barbershop.state ?? '',
      });
      if (barbershop.logo) setLogoPreview(barbershop.logo);
      // Sync InfinitePay handle from DB settings
      const settings = barbershop.settings as Record<string, string> | null;
      if (settings?.infinitePayHandle) {
        setIpayHandle(settings.infinitePayHandle);
        setCachedHandle(settings.infinitePayHandle);
      }
    }
  }, [barbershop]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    let logoUrl = barbershop?.logo ?? null;
    if (logoFile) {
      const url = await uploadLogo(logoFile);
      if (url) logoUrl = url;
    }
    const ok = await saveBarbershop({ ...form, logo: logoUrl ?? undefined });
    if (ok) showToast({ type: 'success', title: 'Configurações salvas!' });
    else showToast({ type: 'error', title: 'Erro ao salvar', message: 'Tente novamente.' });
  };

  const handleSaveHours = async () => {
    const ok = await saveWorkingHours(workingHours);
    if (ok) showToast({ type: 'success', title: 'Horários atualizados!' });
    else showToast({ type: 'error', title: 'Erro ao salvar horários' });
  };

  const handleToggleSync = (enabled: boolean) => { setAutoOpen(enabled); setSyncEnabledLocal(enabled); };

  const handleSaveHandle = async () => {
    setSavingHandle(true);
    setCachedHandle(ipayHandle.trim());
    // Also persist to Barbershop.settings if we have barbershopId
    if (barbershop?.id) {
      const settings = { ...(barbershop.settings as object ?? {}), infinitePayHandle: ipayHandle.trim() };
      await saveBarbershop({ settings } as Parameters<typeof saveBarbershop>[0]);
    }
    setSavingHandle(false);
    showToast({ type: 'success', title: 'Handle salvo!', message: 'InfinitePay configurado com sucesso.' });
  };

  const handleTestInfinitePay = () => {
    openInfinitePay(
      { orderId: `TEST-${Date.now()}`, amountCents: 100, paymentMethod: 'credit', installments: 1, handle: ipayHandle || undefined },
      { amountCents: 100, paymentMethod: 'CREDIT_CARD', installments: 1, description: 'Teste de integração', clientId: null, barbershopId: barbershop?.id ?? null },
    );
  };

  const handleCreateService = async () => {
    if (!barbershop?.id || !serviceForm.name.trim()) {
      showToast({ type: 'error', title: 'Serviço inválido', message: 'Informe pelo menos o nome do serviço.' });
      return;
    }

    const parsedPrice = Number(serviceForm.price.replace(',', '.'));
    const parsedDuration = Number(serviceForm.duration);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showToast({ type: 'error', title: 'Preço inválido', message: 'Informe um preço numérico válido.' });
      return;
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      showToast({ type: 'error', title: 'Duração inválida', message: 'Informe a duração em minutos.' });
      return;
    }

    setSavingService(true);

    const { error } = await supabase.from('Service').insert({
      barbershopId: barbershop.id,
      name: serviceForm.name.trim(),
      category: serviceForm.category.trim() || 'geral',
      price: parsedPrice,
      duration: parsedDuration,
      sortOrder: services.length,
      isActive: true,
    });

    setSavingService(false);

    if (error) {
      showToast({ type: 'error', title: 'Erro ao criar serviço', message: error.message });
      return;
    }

    setServiceForm({ name: '', price: '', duration: '30', category: '' });
    emitAppDataChanged('service-created');
    showToast({ type: 'success', title: 'Serviço adicionado' });
  };

  const handleToggleService = async (serviceId: string, nextActive: boolean) => {
    const { error } = await supabase
      .from('Service')
      .update({ isActive: nextActive, updatedAt: new Date().toISOString() })
      .eq('id', serviceId);

    if (error) {
      showToast({ type: 'error', title: 'Não foi possível atualizar o serviço', message: error.message });
      return;
    }

    emitAppDataChanged('service-updated');
  };

  const handleCopyPublicLink = async () => {
    if (!barbershop?.slug) return;

    const publicLink = `${window.location.origin}/app?barbershop=${barbershop.slug}`;

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyLabel('Link copiado');
      window.setTimeout(() => setCopyLabel('Copiar link'), 2000);
    } catch {
      showToast({ type: 'error', title: 'Não foi possível copiar o link' });
    }
  };

  const completedTransactions = transactions.filter(
    (transaction) => transaction.type === 'INCOME' && transaction.status === 'COMPLETED',
  );
  const pendingTransactions = transactions.filter((transaction) => transaction.status === 'PENDING');
  const totalReceived = completedTransactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const recentTransactions = transactions.slice(0, 5);
  const openDays = workingHours.filter((entry) => entry.isOpen).length;
  const publicLink = barbershop?.slug ? `${window.location.origin}/app?barbershop=${barbershop.slug}` : '';
  const recentNotifications = notifications.slice(0, 5);
  const appointmentsThisMonth = appointments.filter((appointment) => {
    const now = new Date();
    const scheduledAt = new Date(appointment.scheduledAt);
    return scheduledAt.getMonth() === now.getMonth() && scheduledAt.getFullYear() === now.getFullYear();
  }).length;
  const transactionsByMethod = Object.entries(
    completedTransactions.reduce<Record<string, number>>((accumulator, transaction) => {
      const key = transaction.paymentMethod || 'SEM_METODO';
      accumulator[key] = (accumulator[key] || 0) + Number(transaction.amount || 0);
      return accumulator;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil',       label: 'Perfil da Loja',      icon: <Store size={18} /> },
    { id: 'horario',      label: 'Horário',              icon: <Clock size={18} /> },
    { id: 'integracoes',  label: 'Integrações',          icon: <Link size={18} /> },
    { id: 'pagamentos',   label: 'Pagamentos',           icon: <CreditCard size={18} /> },
    { id: 'notificacoes', label: 'Notificações',         icon: <BellRing size={18} /> },
    { id: 'seguranca',    label: 'Segurança',            icon: <ShieldCheck size={18} /> },
    { id: 'app',          label: 'App do Cliente',       icon: <Smartphone size={18} /> },
  ];

  return (
    <div className="pt-8 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Configurações</h1>
          <p className="text-on-surface-variant font-medium">Ajuste as preferências gerais da sua barbearia.</p>
        </div>
        {(activeTab === 'perfil' || activeTab === 'horario') && (
          <button
            onClick={activeTab === 'perfil' ? handleSave : handleSaveHours}
            disabled={saving || loading}
            className="bg-[#C8FF00] text-[#4f6700] px-6 py-3 rounded-xl font-extrabold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0px_0px_20px_rgba(200,255,0,0.2)] disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-2 shrink-0">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === tab.id ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20' : 'text-[#A0A0A0] hover:text-white hover:bg-white/5'}`}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8">

          {/* ── Perfil da Loja ──────────────────────────────── */}
          {activeTab === 'perfil' && (
            <>
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#C8FF00]" size={32} /></div>
              ) : (
                <>
                  <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Store className="text-[#C8FF00]" size={24} /> Informações do Estabelecimento
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-8 mb-8">
                      {/* Logo upload */}
                      <div className="flex flex-col items-center gap-4">
                        <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                        <button onClick={() => logoInputRef.current?.click()}
                          className="w-32 h-32 rounded-2xl bg-surface-container-highest border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#C8FF00] hover:bg-[#C8FF00]/5 transition-all group overflow-hidden relative">
                          {logoPreview
                            ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            : <span className="text-3xl font-black text-[#C8FF00]">{form.name ? form.name.charAt(0).toUpperCase() : 'BP'}</span>}
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={20} className="text-white mb-1" />
                            <span className="text-xs text-white font-bold">Alterar</span>
                          </div>
                        </button>
                        {logoPreview && <button onClick={() => { setLogoPreview(null); setLogoFile(null); }} className="text-xs font-bold text-red-400 hover:underline">Remover</button>}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                          { label: 'Nome da Barbearia', key: 'name', type: 'text' },
                          { label: 'CNPJ / Documento',  key: 'cnpj', type: 'text' },
                          { label: 'Telefone',           key: 'phone', type: 'tel' },
                          { label: 'E-mail de Contato',  key: 'email', type: 'email' },
                        ].map(({ label, key, type }) => (
                          <div key={key} className="space-y-2">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
                            <input type={type} value={(form as Record<string, string>)[key]}
                              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Descrição / Bio</label>
                      <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors resize-none" />
                      <p className="text-[10px] text-on-surface-variant text-right">{form.description.length}/150</p>
                    </div>
                  </div>

                  {/* Localização */}
                  <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Globe className="text-[#C8FF00]" size={24} /> Localização
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {[
                        { label: 'Endereço', key: 'address', span: 2 },
                        { label: 'CEP', key: 'zipCode', span: 1 },
                        { label: 'Bairro', key: 'neighborhood', span: 1 },
                        { label: 'Cidade', key: 'city', span: 1 },
                        { label: 'Estado', key: 'state', span: 1 },
                      ].map(({ label, key, span }) => (
                        <div key={key} className={`space-y-2 ${span === 2 ? 'md:col-span-2' : ''}`}>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
                          <input type="text" value={(form as Record<string, string>)[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-4 py-3 bg-surface-container-lowest border border-white/10 rounded-xl focus:outline-none focus:border-[#C8FF00] text-white transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Horário de Funcionamento ────────────────────── */}
          {activeTab === 'horario' && (
            <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="text-[#C8FF00]" size={24} /> Horário de Funcionamento
              </h2>
              {loading
                ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#C8FF00]" size={28} /></div>
                : (
                  <div className="space-y-4">
                    {workingHours.map((wh, idx) => (
                      <div key={wh.dayOfWeek} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border transition-colors ${wh.isOpen ? 'bg-surface-container border-white/10' : 'bg-surface-container/30 border-white/5 opacity-60'}`}>
                        {/* Toggle */}
                        <button onClick={() => setWorkingHours((prev) => prev.map((h, i) => i === idx ? { ...h, isOpen: !h.isOpen } : h))}
                          className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${wh.isOpen ? 'bg-[#C8FF00]' : 'bg-white/10'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${wh.isOpen ? 'translate-x-5' : ''}`} />
                        </button>
                        <span className="w-10 text-sm font-bold text-white shrink-0">{DAY_LABELS[wh.dayOfWeek]}</span>
                        {wh.isOpen ? (
                          <div className="flex items-center gap-3 flex-1">
                            <div>
                              <label className="text-[10px] text-on-surface-variant uppercase">Abre</label>
                              <input type="time" value={wh.openTime}
                                onChange={(e) => setWorkingHours((prev) => prev.map((h, i) => i === idx ? { ...h, openTime: e.target.value } : h))}
                                className="block w-28 px-3 py-2 bg-surface-container-lowest border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#C8FF00] [color-scheme:dark]" />
                            </div>
                            <span className="text-on-surface-variant mt-4">–</span>
                            <div>
                              <label className="text-[10px] text-on-surface-variant uppercase">Fecha</label>
                              <input type="time" value={wh.closeTime}
                                onChange={(e) => setWorkingHours((prev) => prev.map((h, i) => i === idx ? { ...h, closeTime: e.target.value } : h))}
                                className="block w-28 px-3 py-2 bg-surface-container-lowest border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#C8FF00] [color-scheme:dark]" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-on-surface-variant flex-1">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── Integrações ─────────────────────────────────── */}
          {activeTab === 'integracoes' && (
            <div className="space-y-6">
              {/* Google Calendar */}
              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="text-[#C8FF00]" size={24} />
                  <h2 className="text-xl font-bold text-white">Google Calendar</h2>
                  <span className="text-xs font-bold px-3 py-1 bg-[#C8FF00]/10 text-[#C8FF00] rounded-full border border-[#C8FF00]/20 ml-auto">✓ Ativo</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6">
                  Após cada agendamento, o Google Calendar abre automaticamente com o evento preenchido — basta clicar em <strong className="text-white">Salvar</strong>. Sem login extra, sem configuração.
                </p>

                <div className="p-5 bg-surface-container border border-white/5 rounded-2xl mb-4 flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center p-2 shrink-0">
                    <GoogleIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Abre no Google Calendar da sua conta</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Já conectado à conta Google do navegador — sem senha adicional</p>
                  </div>
                  <button onClick={createTestEvent}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">
                    Testar
                  </button>
                </div>

                <div className="p-4 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#C8FF00]">Abrir Calendar após agendar</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Abre nova aba com o evento preenchido automaticamente</p>
                  </div>
                  <button onClick={() => handleToggleSync(!syncEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${syncEnabled ? 'bg-[#C8FF00]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-[#0D0D0D] shadow-md transition-transform ${syncEnabled ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>

              {/* InfinitePay */}
              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-[#C8FF00]" size={24} />
                  <h2 className="text-xl font-bold text-white">InfinitePay (Tap to Pay)</h2>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ml-auto ${ipayHandle ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    {ipayHandle ? '✓ Configurado' : '⚠ Não configurado'}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6">
                  Receba por aproximação (NFC) via InfiniteTap. Configure seu identificador para que o valor e as parcelas sejam enviados automaticamente ao app.
                </p>

                {/* Handle input */}
                <div className="mb-5">
                  <label className="block text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-2">
                    Identificador InfinitePay (handle)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={ipayHandle}
                      onChange={(e) => setIpayHandle(e.target.value)}
                      placeholder="ex: minha_barbearia"
                      className="flex-1 bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-on-surface-variant focus:outline-none focus:border-[#C8FF00]/40"
                    />
                    <button onClick={handleSaveHandle} disabled={savingHandle}
                      className="px-5 py-3 bg-[#C8FF00] text-[#4f6700] font-black rounded-xl hover:bg-[#b3e600] transition-colors disabled:opacity-60 flex items-center gap-2 text-sm shrink-0">
                      {savingHandle ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Salvar
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">
                    Encontre no app InfinitePay → <strong className="text-white">Perfil → Nome de usuário</strong>
                  </p>
                </div>

                {/* App info */}
                <div className="p-4 bg-surface-container border border-white/5 rounded-xl flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <SmartphoneNfc size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Como funciona</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">No PDV → selecione Cartão → "Cobrar com InfinitePay" → app abre com valor e parcelas prontos → cliente aproxima o cartão</p>
                  </div>
                </div>

                {/* Test button */}
                {ipayHandle && (
                  <button onClick={handleTestInfinitePay}
                    className="w-full py-3 border border-[#C8FF00]/20 bg-[#C8FF00]/5 text-[#C8FF00] font-bold rounded-xl hover:bg-[#C8FF00]/10 transition-colors text-sm flex items-center justify-center gap-2">
                    <SmartphoneNfc size={15} /> Testar integração (R$1,00)
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pagamentos' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  title="Recebido"
                  value={formatCurrency(totalReceived)}
                  helper={`${completedTransactions.length} transações concluídas`}
                  loading={runtimeLoading}
                />
                <MetricCard
                  title="Pendentes"
                  value={String(pendingTransactions.length)}
                  helper="Aguardando conclusão ou callback"
                  loading={runtimeLoading}
                />
                <MetricCard
                  title="Atendimentos no mês"
                  value={String(appointmentsThisMonth)}
                  helper="Baseado nos agendamentos reais"
                  loading={runtimeLoading}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="text-[#C8FF00]" size={22} /> Formas de pagamento
                  </h2>
                  {transactionsByMethod.length === 0 ? (
                    <EmptyCardMessage message="Nenhum recebimento concluído ainda." />
                  ) : (
                    <div className="space-y-3">
                      {transactionsByMethod.map(([method, total]) => (
                        <div key={method} className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container p-4">
                          <div>
                            <p className="text-sm font-bold text-white">{method.replaceAll('_', ' ')}</p>
                            <p className="text-xs text-on-surface-variant">Volume registrado no banco</p>
                          </div>
                          <span className="text-sm font-black text-[#C8FF00]">{formatCurrency(total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="text-[#C8FF00]" size={22} /> Últimas transações
                  </h2>
                  {recentTransactions.length === 0 ? (
                    <EmptyCardMessage message="Nenhuma transação registrada ainda." />
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="rounded-xl border border-white/5 bg-surface-container p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-white">{transaction.description || 'Movimentação financeira'}</p>
                              <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                                {transaction.status} • {transaction.gateway || transaction.paymentMethod || 'manual'}
                              </p>
                            </div>
                            <span className={`text-sm font-black ${transaction.status === 'COMPLETED' ? 'text-[#C8FF00]' : 'text-yellow-400'}`}>
                              {formatCurrency(Number(transaction.amount || 0))}
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-on-surface-variant">{formatDateTime(transaction.date)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Não lidas" value={String(unreadCount)} helper="Atualizadas via realtime" loading={notificationsLoading} />
                <MetricCard title="Total" value={String(notifications.length)} helper="Histórico salvo na tabela Notification" loading={notificationsLoading} />
                <MetricCard title="Usuário vinculado" value={internalUser?.name || 'Sem usuário'} helper="Contexto interno resolvido do Supabase" loading={false} />
              </div>

              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Feed recente</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">As notificações abaixo já estão sendo lidas diretamente do banco.</p>
                  </div>
                  <button
                    onClick={() => markAllAsRead()}
                    disabled={!unreadCount}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marcar tudo como lido
                  </button>
                </div>

                {recentNotifications.length === 0 ? (
                  <EmptyCardMessage message="Nenhuma notificação registrada ainda." />
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((notification) => (
                      <div key={notification.id} className="rounded-xl border border-white/5 bg-surface-container p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-white">{notification.title}</p>
                            <p className="mt-1 text-sm text-on-surface-variant">{notification.message}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${notification.is_read ? 'bg-white/5 text-on-surface-variant' : 'bg-[#C8FF00]/10 text-[#C8FF00]'}`}>
                            {notification.is_read ? 'Lida' : 'Nova'}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-on-surface-variant">{formatDateTime(notification.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-[#C8FF00]" size={22} /> Conta autenticada
                </h2>
                <div className="space-y-3 text-sm">
                  <InfoRow label="E-mail" value={user?.email || 'Não informado'} />
                  <InfoRow label="Role interna" value={internalUser?.role || 'Não resolvida'} />
                  <InfoRow label="Auth user" value={user?.id || 'Sem sessão'} mono />
                  <InfoRow label="Usuário interno" value={internalUser?.id || 'Não criado'} mono />
                  <InfoRow label="Último login" value={user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : 'Não disponível'} />
                </div>
              </div>

              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Store className="text-[#C8FF00]" size={22} /> Vínculo operacional
                </h2>
                <div className="space-y-3 text-sm">
                  <InfoRow label="Barbearia ativa" value={barbershop?.name || 'Não vinculada'} />
                  <InfoRow label="Slug público" value={barbershop?.slug || 'Não definido'} mono />
                  <InfoRow label="Cidade / UF" value={barbershop ? `${barbershop.city || '-'} / ${barbershop.state || '-'}` : 'Não definido'} />
                  <InfoRow label="InfinitePay handle" value={ipayHandle || 'Não configurado'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Link público" value={barbershop?.slug ? 'Ativo' : 'Sem slug'} helper="Acesso ao app do cliente" loading={loading} />
                <MetricCard title="Serviços ativos" value={String(services.filter((service) => service.isActive).length)} helper="Catálogo usado no agendamento" loading={runtimeLoading} />
                <MetricCard title="Dias abertos" value={String(openDays)} helper="Baseado na tabela WorkingHours" loading={loading} />
              </div>

              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Vitrine do cliente</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">Esse link abre a barbearia pública usando o slug salvo no banco.</p>
                  </div>
                  <button
                    onClick={handleCopyPublicLink}
                    disabled={!publicLink}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copyLabel}
                  </button>
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-container p-4">
                  <p className="text-sm text-white break-all">{publicLink || 'Salve o perfil da loja para gerar o link público.'}</p>
                </div>
              </div>

              <div className="glass-card rounded-[1.5rem] p-8 border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <Smartphone className="text-[#C8FF00]" size={22} />
                  <h2 className="text-xl font-bold text-white">Catálogo de serviços</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nome do serviço"
                    className="rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-[#C8FF00]"
                  />
                  <input
                    type="text"
                    value={serviceForm.price}
                    onChange={(event) => setServiceForm((current) => ({ ...current, price: event.target.value }))}
                    placeholder="Preço"
                    className="rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-[#C8FF00]"
                  />
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={serviceForm.duration}
                    onChange={(event) => setServiceForm((current) => ({ ...current, duration: event.target.value }))}
                    placeholder="Duração"
                    className="rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-[#C8FF00]"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={serviceForm.category}
                      onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))}
                      placeholder="Categoria"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-[#C8FF00]"
                    />
                    <button
                      onClick={handleCreateService}
                      disabled={savingService}
                      className="flex items-center gap-2 rounded-xl bg-[#C8FF00] px-4 py-3 text-sm font-black text-[#4f6700] transition-colors hover:bg-[#b3e600] disabled:opacity-60 shrink-0"
                    >
                      {savingService ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Adicionar
                    </button>
                  </div>
                </div>

                {services.length === 0 ? (
                  <EmptyCardMessage message="Nenhum serviço cadastrado ainda. Adicione o primeiro acima." />
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-white/5 bg-surface-container p-4">
                        <div>
                          <p className="text-sm font-bold text-white">{service.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                            {(service.category || 'geral').toUpperCase()} • {service.duration} min
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-[#C8FF00]">{formatCurrency(Number(service.price || 0))}</span>
                          <button
                            onClick={() => handleToggleService(service.id, !service.isActive)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${service.isActive ? 'bg-[#C8FF00]/10 text-[#C8FF00]' : 'bg-white/5 text-on-surface-variant'}`}
                          >
                            {service.isActive ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  helper,
  loading,
}: {
  title: string;
  value: string;
  helper: string;
  loading: boolean;
}) {
  return (
    <div className="glass-card rounded-[1.5rem] p-6 border border-white/5">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{loading ? '...' : value}</p>
      <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-surface-container p-4">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`text-right font-bold text-white ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</span>
    </div>
  );
}

function EmptyCardMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-container p-4 text-sm text-on-surface-variant">
      {message}
    </div>
  );
}

const Configuracoes = () => {
  const { role } = useBarbershopContext();
  return role === 'barbeiro' ? <BarberView /> : <AdminView />;
};

export default Configuracoes;

import { useState } from 'react';
import { Loader2, Scissors, Store } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBarbershopContext } from '../contexts/BarbershopContext';

const SetupBarbershop = () => {
  const navigate = useNavigate();
  const { loading, internalUser, needsBarbershopSetup, setupBarbershop, error } = useBarbershopContext();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: internalUser?.email ?? '',
    city: '',
    state: '',
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!loading && !needsBarbershopSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSaving(true);

    try {
      await setupBarbershop(form);
      navigate('/dashboard', { replace: true });
    } catch (setupError) {
      const message =
        setupError instanceof Error ? setupError.message : 'Nao foi possivel criar a barbearia agora.';
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl glass-card rounded-[2rem] p-8 sm:p-10 border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00]">
            <Scissors size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Configuração Inicial</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Crie a sua barbearia para liberar agenda, clientes, financeiro e pagamentos.
            </p>
          </div>
        </div>

        {(error || submitError) && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Nome da Barbearia
            </label>
            <div className="relative">
              <Store className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                required
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-surface-container pl-12 pr-4 py-4 text-white outline-none transition-colors focus:border-[#C8FF00]"
                placeholder="Ex: Barbearia Central"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Telefone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-4 text-white outline-none transition-colors focus:border-[#C8FF00]"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                E-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-4 text-white outline-none transition-colors focus:border-[#C8FF00]"
                placeholder="contato@barbearia.com"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Cidade
              </label>
              <input
                value={form.city}
                onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-4 text-white outline-none transition-colors focus:border-[#C8FF00]"
                placeholder="Cuiaba"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Estado
              </label>
              <input
                value={form.state}
                onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-4 text-white outline-none transition-colors focus:border-[#C8FF00]"
                placeholder="MT"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF00] px-6 py-4 font-black text-[#4f6700] transition-colors hover:bg-[#b3e600] disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
            Criar minha barbearia
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupBarbershop;

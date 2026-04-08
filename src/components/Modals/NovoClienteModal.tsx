import { useState } from 'react';
import { X, UserPlus, FileText, Loader2 } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useBarbershopContext } from '../../contexts/BarbershopContext';
import { supabase } from '../../lib/supabase';
import { emitAppDataChanged } from '../../lib/events';

const NovoClienteModal = () => {
  const { activeModal, closeModal } = useModal();
  const { barbershop } = useBarbershopContext();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birthDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeModal !== 'NOVO_CLIENTE') return null;

  const reset = () => {
    setForm({ name: '', phone: '', birthDate: '', notes: '' });
    setError(null);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  const handleSubmit = async () => {
    if (!barbershop?.id) {
      setError('Nenhuma barbearia ativa encontrada.');
      return;
    }

    if (!form.name.trim()) {
      setError('Informe o nome do cliente.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('Client').insert({
      barbershopId: barbershop.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      birthDate: form.birthDate || null,
      notes: form.notes.trim() || null,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      isActive: true,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    emitAppDataChanged('client-created');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00]">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Novo Cliente</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">NOME COMPLETO</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20"
              placeholder="Ex: Joao da Silva"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">TELEFONE (WHATSAPP)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">DATA DE NASCIMENTO</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((current) => ({ ...current, birthDate: e.target.value }))}
                className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20 [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">NOTAS / OBSERVAÇÕES</label>
            <div className="relative">
              <FileText className="absolute top-3 left-3 text-on-surface-variant" size={16} />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                className="w-full bg-surface-container border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20 min-h-[100px] resize-none"
                placeholder="Ex: Alergico a lamina, prefere degradê alto..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 border-t border-white/5 flex gap-4 justify-end bg-[#0a0a0a]">
          <button onClick={handleClose} className="px-6 py-3 font-bold text-on-surface transition-colors hover:bg-white/5 rounded-xl">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 font-bold text-[#4f6700] bg-[#C8FF00] hover:bg-[#b3e600] transition-colors rounded-xl neon-shadow disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovoClienteModal;

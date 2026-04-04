import { X, UserPlus, FileText } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const NovoClienteModal = () => {
  const { activeModal, closeModal } = useModal();

  if (activeModal !== 'NOVO_CLIENTE') return null;

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
          <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">NOME COMPLETO</label>
            <input type="text" className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20" placeholder="Ex: João da Silva" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">TELEFONE (WHATSAPP)</label>
              <input type="tel" className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">DATA DE NASCIMENTO</label>
              <input type="date" className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20 [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">NOTAS / OBSERVAÇÕES</label>
            <div className="relative">
              <FileText className="absolute top-3 left-3 text-on-surface-variant" size={16} />
              <textarea className="w-full bg-surface-container border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20 min-h-[100px] resize-none" placeholder="Ex: Alérgico a lâmina, prefere degradê alto..."></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 border-t border-white/5 flex gap-4 justify-end bg-[#0a0a0a]">
          <button onClick={closeModal} className="px-6 py-3 font-bold text-on-surface transition-colors hover:bg-white/5 rounded-xl">Cancelar</button>
          <button className="px-6 py-3 font-bold text-[#4f6700] bg-[#C8FF00] hover:bg-[#b3e600] transition-colors rounded-xl neon-shadow">Cadastrar Cliente</button>
        </div>
      </div>
    </div>
  );
};

export default NovoClienteModal;

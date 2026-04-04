import { X, Calendar, Clock, User, Scissors, Search } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const AgendamentoModal = () => {
  const { activeModal, closeModal } = useModal();

  if (activeModal !== 'AGENDAMENTO') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(200,255,0,0.1)] relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85dvh] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[rgba(200,255,0,0.02)] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8FF00]"></span>
            Novo Agendamento
          </h2>
          <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar pb-10">
          {/* Cliente */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Buscar Cliente</label>
            <div className="relative">
              <Search className="absolute top-3 left-4 text-on-surface-variant" size={18} />
              <input type="text" className="w-full bg-surface-container border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all text-white placeholder-white/20" placeholder="Nome ou telefone do cliente..." />
            </div>
            <div className="mt-2 text-right">
              <button className="text-[10px] text-[#C8FF00] hover:underline font-bold uppercase tracking-wider">+ Cadastrar Novo Cliente</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Serviço */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Serviço</label>
              <div className="relative">
                <Scissors className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                <select className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer">
                  <option value="" disabled selected>Selecione...</option>
                  <option value="corte">Corte Degradê (R$ 45)</option>
                  <option value="barba">Barba + Toalha Quente (R$ 35)</option>
                  <option value="combo">Combo Completo (R$ 75)</option>
                </select>
              </div>
            </div>

            {/* Profissional */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Profissional</label>
              <div className="relative">
                <User className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                <select className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer">
                  <option value="" disabled selected>Qualquer Profissional</option>
                  <option value="ricardo">Ricardo Silva (Master)</option>
                  <option value="vinicius">Vinícius Junior (Sênior)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Data</label>
              <div className="relative">
                <Calendar className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                <input type="date" className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white [color-scheme:dark]" />
              </div>
            </div>

            {/* Horário */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block uppercase tracking-wider">Horário Disponível</label>
              <div className="relative">
                <Clock className="absolute top-3 left-3 text-on-surface-variant" size={16} />
                <select className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-all text-white appearance-none cursor-pointer">
                  <option value="" disabled selected>Escolha a data 1º</option>
                  <option value="09:00">09:00 - 09:45</option>
                  <option value="10:00">10:00 - 10:45</option>
                  <option value="14:30">14:30 - 15:15</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-white/5 flex gap-4 justify-between bg-[#0a0a0a] items-center shrink-0">
          <div className="text-left hidden sm:block">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total Estimado</p>
            <p className="text-lg font-black text-[#C8FF00]">R$ 0,00</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={closeModal} className="px-6 py-3 font-bold text-on-surface transition-colors hover:bg-white/5 rounded-xl w-full sm:w-auto">Cancelar</button>
            <button className="px-8 py-3 font-black text-[#4f6700] bg-[#C8FF00] hover:bg-[#b3e600] transition-colors rounded-xl neon-shadow w-full sm:w-auto shadow-[0_0_20px_rgba(200,255,0,0.2)]">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoModal;

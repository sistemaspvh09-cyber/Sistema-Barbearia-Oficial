import { X, SmartphoneNfc } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useState } from 'react';
import { triggerTapToPay } from '../../lib/infinitePay';

const PDVModal = () => {
  const { activeModal, closeModal } = useModal();
  const [amountValue, setAmountValue] = useState<string>('');

  if (activeModal !== 'PDV') return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    
    if (!digits) {
      setAmountValue('');
      return;
    }
    
    // Convertendo para Float (divide por 100 para criar as casas decimais)
    const numericValue = parseInt(digits, 10) / 100;
    
    const formatted = numericValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    setAmountValue(formatted);
  };

  const handleCharge = () => {
    if (!amountValue) {
      alert("Digite um valor válido para cobrar.");
      return;
    }

    const digits = amountValue.replace(/\D/g, '');
    const numericAmount = parseInt(digits, 10) / 100;
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Digite um valor válido para cobrar.");
      return;
    }

    const referenceId = `venda_${new Date().getTime()}`;
    
    // Mostra alerta explicativo no Desktop, mas tenta abrir no Celular
    const success = triggerTapToPay({ amount: numericAmount, referenceId });
    if (!success) {
      // Falldown visual: Como não estamos num celular, apenas mostra o payload gerado.
      console.log(`Simulação Desktop: Cobrando R$ ${numericAmount.toFixed(2)} com RefID: ${referenceId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)]">
      <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-sm flex flex-col overflow-hidden max-h-[85dvh] shadow-[0_0_50px_rgba(200,255,0,0.1)] relative animate-in zoom-in duration-300">
        <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0 bg-[rgba(200,255,0,0.02)]">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse"></span>
            Tap to Pay
          </h2>
          <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-8 pt-6 flex flex-col items-center custom-scrollbar pb-10">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Valor da Cobrança</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl font-bold text-on-surface-variant">R$</span>
            <input 
              type="tel" 
              className="bg-transparent text-5xl font-black text-white text-center w-full max-w-[220px] outline-none placeholder:text-white/10" 
              placeholder="0,00"
              value={amountValue}
              onChange={handleAmountChange}
              autoFocus
            />
          </div>

          <button 
            onClick={handleCharge}
            className="w-full py-4 bg-[#C8FF00] hover:bg-[#b3e600] text-[#4f6700] rounded-2xl font-black text-lg tracking-tight neon-shadow transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1"
          >
            <div className="flex items-center gap-2">
              <SmartphoneNfc size={24} />
              Aproximar Cartão
            </div>
            <span className="text-[10px] font-bold opacity-70">via InfinitePay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDVModal;

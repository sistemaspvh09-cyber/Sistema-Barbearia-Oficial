import { useNavigate } from 'react-router-dom';
import { SmartphoneNfc, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const CustomerCheckout = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFinish = () => {
    setIsSuccess(true);
    setTimeout(() => {
      navigate('/app/historico');
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 animate-in zoom-in">
        <div className="w-24 h-24 bg-[#C8FF00]/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-[#C8FF00]" />
        </div>
        <h2 className="text-2xl font-black text-white text-center">Reserva<br />Confirmada!</h2>
        <p className="text-sm text-on-surface-variant text-center mt-4">Te esperamos no dia 25/Out às 10:30.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      <div className="p-6 flex-1">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Resumo</h2>
          <div className="bg-surface-container rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Corte Degradê</span>
              <span className="text-white font-bold">R$ 45,00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Data/Hora</span>
              <span className="text-white font-bold">25 Out, 10:30</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Barbeiro</span>
              <span className="text-white font-bold">Ricardo S.</span>
            </div>
            <div className="pt-3 border-t border-white/5 flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="font-black text-[#C8FF00] text-lg">R$ 45,00</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pagamento Antecipado</h2>
          <div className="space-y-3">
            
            <button 
              onClick={() => setMethod('pix')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${method === 'pix' ? 'bg-[#C8FF00]/10 border-[#C8FF00]/50' : 'bg-surface-container border-white/5 hover:border-white/20'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'pix' ? 'bg-[#C8FF00] text-[#4f6700]' : 'bg-white/5 text-on-surface-variant'}`}>
                <SmartphoneNfc size={20} />
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-white text-sm">Transferência via PIX</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Aprovação Imediata</p>
              </div>
            </button>

            <button 
              onClick={() => setMethod('card')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${method === 'card' ? 'bg-[#C8FF00]/10 border-[#C8FF00]/50' : 'bg-surface-container border-white/5 hover:border-white/20'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'card' ? 'bg-[#C8FF00] text-[#4f6700]' : 'bg-white/5 text-on-surface-variant'}`}>
                <CreditCard size={20} />
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-white text-sm">Cartão de Crédito</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Em até 3x</p>
              </div>
            </button>

            <button 
              onClick={() => setMethod('local')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${method === 'local' ? 'bg-[#C8FF00]/10 border-[#C8FF00]/50' : 'bg-surface-container border-white/5 hover:border-white/20'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'local' ? 'bg-[#C8FF00] text-[#4f6700]' : 'bg-white/5 text-on-surface-variant'}`}>
                <Wallet size={20} />
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-white text-sm">Pagar no Local</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Dinheiro, Débito ou InfinitePay</p>
              </div>
            </button>

          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button 
          onClick={handleFinish}
          disabled={!method}
          className="w-full bg-[#C8FF00] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b3e600] text-[#4f6700] p-4 rounded-2xl font-black transition-all"
        >
          Confirmar e Agendar
        </button>
      </div>
    </div>
  );
};

export default CustomerCheckout;

import { X, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MobileDrawer = () => {
  const { activeModal, closeModal } = useModal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (activeModal !== 'MENU_MOBILE') return null;

  const isBarber = user?.user_metadata?.role === 'barbeiro';

  const handleSignOut = () => {
    closeModal();
    signOut();
  };

  const handleNavigate = (path: string) => {
    closeModal();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden sm:p-4">
      <div className="bg-[#0D0D0D] border-t border-x sm:border sm:rounded-3xl border-white/10 rounded-t-3xl w-full max-w-sm overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom duration-300 max-h-[85dvh] flex flex-col">
        
        {/* Handle for dragging visualization */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>

        <div className="p-5 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-white/10">
               <User size={20} className={isBarber ? 'text-white' : 'text-[#C8FF00]'} />
             </div>
             <div>
               <h3 className="font-bold text-white text-sm">{user?.email?.split('@')[0]}</h3>
               <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                 {isBarber ? 'Sua Conta (Barbeiro)' : 'Premium Admin'}
               </p>
             </div>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-2 flex-1 relative custom-scrollbar pb-10">
          
          <button 
            onClick={() => handleNavigate('/dashboard')} 
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <User size={18} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Meu Perfil</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Faturamento, Metas e Dados</p>
            </div>
          </button>

          <button 
            onClick={() => handleNavigate('/configuracoes')} 
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <Settings size={18} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Configurações e Integrações</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Ajustes, Agenda e Pagamentos</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Suporte & Ajuda</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Falar com o suporte técnico</p>
            </div>
          </button>

          <div className="pt-4 mt-4 border-t border-white/5">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-error/10 text-error-dim transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                <LogOut size={18} />
              </div>
              <p className="font-bold text-sm">Sair do Sistema</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;

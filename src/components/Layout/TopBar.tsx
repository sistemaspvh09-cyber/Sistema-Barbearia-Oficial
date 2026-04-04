import { Search, Settings, Plus, ShoppingCart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from '../Notifications/NotificationPanel';

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/agenda': 'Agenda',
    '/clientes': 'Gestão de Clientes',
    '/equipe': 'Equipe de Barbeiros',
    '/financeiro': 'Financeiro Global',
    '/estoque': 'Gestão de Estoque',
    '/configuracoes': 'Configurações',
    '/fidelidade': 'Fidelidade',
  };
  return routes[pathname] || 'BarberPro';
};

const TopBar = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { openModal } = useModal();
  const { user } = useAuth();

  const isBarber = user?.user_metadata?.role === 'barbeiro';
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    (isBarber ? 'Barbeiro' : 'Admin BarberPro');
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] xl:w-[calc(100%-18rem)] h-16 lg:h-20 z-40 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 lg:px-8">
      {/* Mobile Title */}
      <div className="lg:hidden">
        <h1 className="text-lg font-black text-[#C8FF00] tracking-tight">{pageTitle}</h1>
      </div>

      {/* Desktop Search */}
      <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-2 w-72 xl:w-96 border border-white/5 focus-within:ring-2 focus-within:ring-[#C8FF00]/50 transition-all">
        <Search className="text-on-surface-variant mr-3" size={18} />
        <input
          type="text"
          placeholder="Buscar cliente, serviço..."
          className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant w-full outline-none"
        />
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        {/* Quick Actions — apenas para Admin */}
        {!isBarber && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('AGENDAMENTO')}
              className="hidden sm:flex items-center justify-center w-10 h-10 lg:w-auto lg:px-4 lg:h-10 bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl text-sm font-bold text-white"
            >
              <Plus size={18} />
              <span className="hidden lg:inline ml-2">Agendar</span>
            </button>
            <button
              onClick={() => openModal('PDV')}
              className="flex items-center justify-center w-10 h-10 lg:w-auto lg:px-4 lg:h-10 bg-[#C8FF00] hover:bg-[#b3e600] text-[#4f6700] transition-colors rounded-xl text-sm font-bold neon-shadow"
            >
              <ShoppingCart size={18} />
              <span className="hidden lg:inline ml-2">PDV</span>
            </button>
          </div>
        )}

        {/* Barbeiro: botão rápido de agendamento */}
        {isBarber && (
          <button
            onClick={() => openModal('AGENDAMENTO')}
            className="hidden sm:flex items-center justify-center w-10 h-10 lg:w-auto lg:px-4 lg:h-10 bg-[#C8FF00] hover:bg-[#b3e600] text-[#4f6700] transition-colors rounded-xl text-sm font-bold neon-shadow"
          >
            <Plus size={18} />
            <span className="hidden lg:inline ml-2">Agendar</span>
          </button>
        )}

        <div className="flex items-center gap-3 lg:gap-4 border-l border-white/10 pl-3 lg:pl-4">
          {/* Painel de Notificações em tempo real */}
          <NotificationPanel />

          <button className="hidden lg:block text-[#A0A0A0] hover:text-[#C8FF00] transition-colors">
            <Settings size={20} />
          </button>
        </div>

        {/* Avatar + Nome */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white group-hover:text-[#C8FF00] transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              {isBarber ? 'Barbeiro' : 'Unidade Matriz'}
            </p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-[#C8FF00]/30 p-0.5 overflow-hidden group-hover:border-[#C8FF00] transition-all bg-surface-container">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#C8FF00]/20 flex items-center justify-center text-[#C8FF00] text-xs font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

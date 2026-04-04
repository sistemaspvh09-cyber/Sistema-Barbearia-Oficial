import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Calendar, Scissors, ArrowLeft } from 'lucide-react';
import CustomerNotifications from '../Notifications/CustomerNotifications';

const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderInfo = (path: string) => {
    if (path.includes('agendar') || path.includes('checkout')) {
      return { title: 'Agendar Horário', subtitle: 'Reserva Rápida' };
    }
    if (path.includes('historico')) {
      return { title: 'Suas Reservas', subtitle: 'Minha Conta' };
    }
    if (path.includes('login') || path.includes('cadastro')) {
      return { title: 'Minha Conta', subtitle: 'Acesse seu perfil' };
    }
    return { title: 'BarberPro', subtitle: 'Barbearia Premium' };
  };

  const { title, subtitle } = getHeaderInfo(location.pathname);
  const isHome = location.pathname.endsWith('/app') || location.pathname.endsWith('/app/');

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body max-w-md mx-auto shadow-2xl relative overflow-x-hidden border-x border-white/5">
      {/* App Header */}
      <header className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-on-surface-variant hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-white">{title}</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#C8FF00] font-bold">{subtitle}</p>
          </div>
        </div>

        {/* 🔔 Notificações do cliente */}
        <div className="flex items-center gap-2">
          <CustomerNotifications />
          {!isHome && (
            <div className="w-8 h-8 rounded-full bg-[#C8FF00]/10 flex items-center justify-center text-[#C8FF00] border border-[#C8FF00]/30 shadow-[0_0_10px_rgba(200,255,0,0.1)]">
              <User size={14} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pb-24 relative custom-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-[#0D0D0D]/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 z-50 pb-safe">
        <div className="flex justify-between items-center max-w-xs mx-auto">
          <button
            onClick={() => navigate('/app')}
            className={`flex flex-col items-center gap-1 transition-all ${isHome ? 'text-[#C8FF00]' : 'text-on-surface-variant hover:text-white'}`}
          >
            <Scissors size={24} className={isHome ? 'fill-[#C8FF00]/20' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Serviços</span>
          </button>

          <button
            onClick={() => navigate('/app/historico')}
            className={`flex flex-col items-center gap-1 transition-all ${location.pathname.includes('historico') ? 'text-[#C8FF00]' : 'text-on-surface-variant hover:text-white'}`}
          >
            <Calendar size={24} className={location.pathname.includes('historico') ? 'fill-[#C8FF00]/20' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Agenda</span>
          </button>

          <button
            onClick={() => navigate('/app/login')}
            className={`flex flex-col items-center gap-1 transition-all ${location.pathname.includes('login') ? 'text-[#C8FF00]' : 'text-on-surface-variant hover:text-white'}`}
          >
            <User size={24} className={location.pathname.includes('login') ? 'fill-[#C8FF00]/20' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout;

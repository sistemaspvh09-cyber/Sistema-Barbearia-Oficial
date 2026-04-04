
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Scissors, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  CircleDollarSign, 
  Package, 
  Settings, 
  HelpCircle, 
  LogOut,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Agenda', path: '/agenda', icon: CalendarDays },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Equipe', path: '/equipe', icon: Scissors },
    { name: 'Financeiro', path: '/financeiro', icon: CircleDollarSign },
    { name: 'Estoque', path: '/estoque', icon: Package },
    { name: 'Fidelidade', path: '/fidelidade', icon: Award },
  ];

  return (
    <aside className="h-screen w-64 lg:w-72 fixed left-0 top-0 overflow-y-auto border-r border-white/5 bg-[#0D0D0D] z-50 flex-col p-6 gap-2 hidden lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-[#C8FF00] flex items-center justify-center shadow-[0px_0px_15px_rgba(200,255,0,0.3)]">
          <Scissors className="text-[#4f6700]" size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-[#C8FF00] tracking-tighter">BarberPro</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">
            {user?.user_metadata?.role === 'barbeiro' ? 'Barbeiro' : 'Premium Admin'}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {menuItems.filter((item) => {
          if (user?.user_metadata?.role === 'barbeiro') {
            return !['Equipe', 'Estoque', 'Fidelidade'].includes(item.name);
          }
          return true; // admin sees everything
        }).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#C8FF00] text-[#4f6700] font-bold shadow-[0px_0px_20px_rgba(200,255,0,0.2)]'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-white/5 font-medium hover:scale-[1.02]'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/5 pt-4">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive
                ? 'bg-[#C8FF00] text-[#4f6700] font-bold shadow-[0px_0px_20px_rgba(200,255,0,0.2)]'
                : 'text-[#A0A0A0] hover:text-white hover:bg-white/5 font-medium'
            }`
          }
        >
          <Settings size={20} />
          <span>Configurações</span>
        </NavLink>
        <button className="flex items-center gap-3 px-4 py-3 text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300">
          <HelpCircle size={20} />
          <span className="font-medium">Suporte</span>
        </button>
        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-6 py-3 text-error-dim hover:bg-error/5 hover:text-error transition-all duration-300 rounded-xl group font-semibold text-sm">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
